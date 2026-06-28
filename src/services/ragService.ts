import { env, pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { get, set } from 'idb-keyval';
import { nanoid } from 'nanoid';

// Cấu hình để load model trực tiếp trên trình duyệt, không dùng local file system của Node
env.allowLocalModels = false;
env.useBrowserCache = true;

// Sử dụng Server Proxy của chúng ta để né tránh hoàn toàn lỗi CORS của HuggingFace s3/Xethub
env.remoteHost = window.location.origin + '/api/model-proxy/';

// Khuyến nghị thiết lập wasmPaths bằng CDN để khắc phục lỗi khi tải transformers trong ứng dụng web/Vite
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';

export interface Memory {
  id: string;
  text: string;
  embedding: number[];
  timestamp: number;
  isCore?: boolean;
}

class RAGService {
  private extractor: FeatureExtractionPipeline | null = null;
  private initializing = false;
  private initPromise: Promise<void> | null = null;
  private useFallback = false;
  
  // Các thông số hỗ trợ Retry thông minh
  private failedAttempts = 0;
  private lastAttemptTime = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_COOLDOWN_MS = 60000; // Thử lại sau 60 giây nếu mạng ổn định
  
  // Trạng thái cho giao diện Settings
  public downloadProgress = 0;
  public downloadStatus: 'idle' | 'downloading' | 'success' | 'error' = 'idle';
  
  // Model rất nhẹ gọn (22MB), phù hợp cho trình duyệt
  private modelName = 'Xenova/all-MiniLM-L6-v2';

  // Chức năng sinh vector đặc trưng giả lập nhanh gọn 384-chiều phòng khi CDN bị chặn hoặc Offline
  private generateMockEmbedding(text: string): number[] {
    const size = 384;
    const vector = new Array(size).fill(0);
    const cleanText = text.toLowerCase();
    
    for (let i = 0; i < cleanText.length; i++) {
      const charCode = cleanText.charCodeAt(i);
      const index = (charCode + i) % size;
      vector[index] += 1;
    }
    
    let magnitude = 0;
    for (let i = 0; i < size; i++) {
      magnitude += vector[i] * vector[i];
    }
    magnitude = Math.sqrt(magnitude);
    
    if (magnitude > 0) {
      for (let i = 0; i < size; i++) {
        vector[i] /= magnitude;
      }
    } else {
      vector[0] = 1.0;
    }
    
    return vector;
  }

  public async checkModelCached(): Promise<boolean> {
    if (this.extractor) return true;
    
    if (localStorage.getItem('rag_model_cached') === 'true') {
      this.downloadStatus = 'success';
      this.downloadProgress = 100;
      return true;
    }

    return this.forceCheckModelCached();
  }

  public async forceCheckModelCached(): Promise<boolean> {
     localStorage.removeItem('rag_model_cached');
     if (this.downloadStatus !== 'downloading') {
         this.downloadStatus = 'idle';
         this.downloadProgress = 0;
     }

     if (this.extractor) return true;

     try {
       if ('caches' in window) {
         const cache = await caches.open('transformers-cache');
         let keys = await cache.keys();
         // Tìm kiếm các file mô hình
         const isCached = keys.some(request => 
           request.url.toLowerCase().includes('all-minilm') || 
           request.url.toLowerCase().includes('xenova') ||
           request.url.toLowerCase().includes('onnx')
         );
         
         if (isCached) {
           this.downloadStatus = 'success';
           this.downloadProgress = 100;
           localStorage.setItem('rag_model_cached', 'true');
           return true;
         }
       }
     } catch(e) {
       console.error("Lỗi khi kiểm tra cache Storage:", e);
     }

     return false;
  }

  public get getDownloadStatus() { return this.downloadStatus; }
  public get getDownloadProgress() { return this.downloadProgress; }

  public async preloadModelFromSettings(onProgress?: (progress: number, status: string) => void) {
    if (this.extractor) {
      this.downloadStatus = 'success';
      this.downloadProgress = 100;
      if (onProgress) onProgress(100, 'success');
      return Promise.resolve();
    }
    
    this.downloadStatus = 'downloading';
    this.downloadProgress = 0;
    if (onProgress) onProgress(0, 'downloading');

    try {
      console.log('[RAG] Người dùng yêu cầu tải mô hình Embedding Cục bộ...');
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        progress_callback: (x: any) => {
          if (x.status === 'progress' || x.status === 'download') {
             let prog = x.progress || 0;
             if (prog < 0) prog = 0;
             if (prog > 100) prog = 100;
             this.downloadProgress = prog;
             if (onProgress) onProgress(prog, 'downloading');
          } else if (x.status === 'ready') {
              this.downloadProgress = 100;
          }
        }
      });
      console.log('[RAG] Đã tải thành công mô hình Embedding Cục bộ!');
      this.useFallback = false;
      this.failedAttempts = 0;
      this.initializing = false;
      this.downloadStatus = 'success';
      this.downloadProgress = 100;
      localStorage.setItem('rag_model_cached', 'true');
      if (onProgress) onProgress(100, 'success');
    } catch (error) {
      this.downloadStatus = 'error';
      this.downloadProgress = 0;
      if (onProgress) onProgress(0, 'error');
      console.warn(`[RAG] Lỗi tải từ cài đặt.`, error);
      throw error;
    }
  }

  public async init() {
    if (this.extractor) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initializing = true;
    this.lastAttemptTime = Date.now();
    this.downloadStatus = 'downloading';
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        const isCached = await this.checkModelCached();
        if (!isCached && this.downloadStatus !== 'downloading') {
           // Bắt buộc người dùng tải từ Settings
           console.warn(`[RAG] Mô hình chưa được tải. Cần tải thủ công từ Cài Đặt!`);
           this.useFallback = true;
           this.initializing = false;
           this.downloadStatus = 'idle';
           resolve();
           return;
        }

        console.log('[RAG] Đang nạp mô hình Embedding Cục bộ từ Cache/Settings...');
        this.extractor = await pipeline('feature-extraction', this.modelName, {
          progress_callback: (x: any) => {
            if (x.status === 'progress' || x.status === 'download') {
                let prog = x.progress || 0;
                this.downloadProgress = prog;
            }
          }
        });
        console.log('[RAG] Đã nạp thành công mô hình Embedding Cục bộ!');
        this.useFallback = false;
        this.failedAttempts = 0;
        this.initializing = false;
        this.downloadStatus = 'success';
        this.downloadProgress = 100;
        localStorage.setItem('rag_model_cached', 'true');
        resolve();
      } catch (error) {
        this.failedAttempts++;
        console.warn(`[RAG] Lỗi nạp mô hình: ${this.failedAttempts}/${this.MAX_RETRIES}`, error);
        this.useFallback = true;
        this.initializing = false;
        this.downloadStatus = 'error';
        resolve(); // Luôn giải quyết thành công để đảm bảo trải nghiệm chơi mượt mà không crash
      }
    });

    return this.initPromise;
  }

  // Chuyển văn bản thành Embedding Vector (Mảng 384 chiều)
  public async embedText(text: string): Promise<number[]> {
    // Kiểm tra xem có thể thử tải lại mô hình thực tế hay không
    if (this.useFallback && !this.extractor && this.failedAttempts < this.MAX_RETRIES) {
      const now = Date.now();
      if (now - this.lastAttemptTime > this.RETRY_COOLDOWN_MS) {
        console.log('[RAG] Hết thời gian chờ sự cố mạng. Đang tự động thử tải lại mô hình thực tế trong chế độ chạy ẩn...');
        this.useFallback = false;
        this.initPromise = null;
        this.init().catch(() => {});
      }
    }

    if (this.useFallback) {
      return this.generateMockEmbedding(text);
    }
    
    try {
      if (!this.extractor) {
        await this.init();
      }
      if (this.extractor) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
      }
    } catch (e) {
      console.warn('[RAG] Gặp sự cố khi trích xuất vector, chuyển sang chế độ Mô phỏng cục bộ:', e);
      this.useFallback = true;
    }
    
    return this.generateMockEmbedding(text);
  }

  private getDBKey(saveId: string) {
    const cleanId = saveId || 'temp_session';
    return `rag_memories_${cleanId}`;
  }

  // Lấy toàn bộ bộ nhớ của save ID
  public async getMemories(saveId: string): Promise<Memory[]> {
    if (!saveId) return [];
    const data = await get(this.getDBKey(saveId));
    return data || [];
  }

  // Thêm một mẩu ký ức vào não bộ của AI
  public async addMemory(saveId: string, text: string, isCore: boolean = false): Promise<Memory> {
    const embedding = await this.embedText(text);
    const memory: Memory = {
      id: nanoid(),
      text,
      embedding,
      timestamp: Date.now(),
      isCore
    };

    const targetId = saveId || 'temp_session';
    const memories = await this.getMemories(targetId);
    memories.push(memory);
    await set(this.getDBKey(targetId), memories);
    console.log(`[RAG] Đã ghi nhớ mới vào bộ nhớ "${targetId}" (Core: ${isCore})`);
    
    return memory;
  }

  // Tính độ tương đồng Cosine giữa 2 vector
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Tìm kiếm những ký ức liên quan nhất bằng truy vấn
  public async searchMemory(saveId: string, query: string, topK: number = 3, threshold: number = 0.3): Promise<{core: Memory[], standard: Memory[]}> {
    const memories = await this.getMemories(saveId);
    if (memories.length === 0) return { core: [], standard: [] };

    const coreMemories = memories.filter(m => m.isCore);
    const standardMemories = memories.filter(m => !m.isCore);

    const queryEmbedding = await this.embedText(query);
    
    const scoredMemories = standardMemories.map(memory => {
      const score = this.cosineSimilarity(queryEmbedding, memory.embedding);
      return { memory, score };
    });

    // Lọc các kết quả có độ tương đồng lớn hơn ngưỡng, sau đó sắp xếp giảm dần
    const results = scoredMemories
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.memory);

    return {
      core: coreMemories,
      standard: results
    };
  }

  // Xóa toàn bộ ký ức liên quan đến save game
  public async clearMemories(saveId: string): Promise<void> {
    await set(this.getDBKey(saveId), []);
  }

  // Khôi phục mảng bộ nhớ (Dùng khi Load Save / Import Save)
  public async setMemories(saveId: string, memories: Memory[]): Promise<void> {
    await set(this.getDBKey(saveId), memories || []);
  }
}

export const ragService = new RAGService();
