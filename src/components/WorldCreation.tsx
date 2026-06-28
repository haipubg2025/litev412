import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Shield,
  Zap,
  Sparkles,
  Sword,
  Play,
  BrainCircuit,
  Wand2,
  Loader2,
  User,
  MapPin,
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  Radio,
  X,
  Terminal,
  Download,
  Upload,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { toast } from "sonner";
import { aiService } from "../services/aiService";

type CreationTab = "world" | "mc" | "npc" | "items";

import {
  getWorldCreationSystemInstruction,
  getIdeaDeveloperSystemInstruction,
} from "../utils/worldCreationSystemInstruction";
import {
  safeParseJSON
} from "../utils/jsonRepair";

export default function WorldCreation() {
  const theme = useStore((state) => state.theme);
  const setFullScreenStream = useStore((state) => state.setFullScreenStream);
  const setIsGeneratingStream = useStore(
    (state) => state.setIsGeneratingStream,
  );
  const updateStreamData = useStore((state) => state.updateStreamData);
  const worldCreation = useStore((state) => state.worldCreation);
  const updateWorldCreation = useStore((state) => state.updateWorldCreation);
  const resetWorldCreation = useStore((state) => state.resetWorldCreation);
  const setGameData = useStore((state) => state.setGameData);

  const navigate = useNavigate();

  const { initialIdea, developedIdea, worldData, mcData, npcs, worldDetails, mcsData = [], selectedMcIndex = 0 } =
    worldCreation;

  const [activeTab, setActiveTab] = useState<CreationTab>("world");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDevelopingIdea, setIsDevelopingIdea] = useState(false);
  const [genTimer, setGenTimer] = useState(0);
  const [devTimer, setDevTimer] = useState(0);

  const [generatingFields, setGeneratingFields] = useState<
    Record<string, boolean>
  >({});

  const [mcIdea, setMcIdea] = useState("");
  const [npcIdea, setNpcIdea] = useState("");
  const [locationIdea, setLocationIdea] = useState("");
  const [isGeneratingMc, setIsGeneratingMc] = useState(false);
  const [isGeneratingNpc, setIsGeneratingNpc] = useState(false);
  const [isGeneratingLocation, setIsGeneratingLocation] = useState(false);

  const handleAIGenField = async (
    fieldName: string,
    fieldKey: keyof typeof worldData,
  ) => {
    if (!initialIdea.trim()) {
      toast.error("Vui lòng nhập ý tưởng sơ khai trước!");
      return;
    }

    setGeneratingFields((prev) => ({ ...prev, [fieldKey]: true }));

    const currentFieldValue = worldData[fieldKey as keyof typeof worldData];
    const otherData = { ...worldData };
    // @ts-ignore
    delete otherData[fieldKey];

    const contextData = {
      worldData: otherData,
      mcData,
      npcs,
      worldDetails,
    };

    const fieldInstructions: Record<string, string> = {
      name: "Chỉ trả về một cái tên duy nhất cho thế giới, ngắn gọn, độc đáo. Không giải thích thêm.",
      difficulty: "Chỉ viết về mức độ khó của thế giới (thử thách sinh tồn, tài nguyên, quái vật, v.v.). Không viết lan man.",
      background: "Chỉ tóm tắt bối cảnh tổng quan của thế giới (thế giới này là gì, hình thành ra sao). KHÔNG viết lịch sử chi tiết hay kịch bản mở đầu.",
      starterTimeline: "ĐẶC BIỆT LƯU Ý CHO MỤC MỐC THỜI GIAN MỞ ĐẦU: Chỉ trả về một câu hoặc một cụm từ ngắn gọn xác định mốc thời gian (và địa điểm nếu cần) lúc trò chơi bắt đầu, BẮT BUỘC bao gồm giờ, phút, thứ, ngày, tháng, năm (Ví dụ: '08:30 sáng, Thứ Hai ngày 15 tháng 3 năm 2050, tại thủ đô Tokyo', '23:45, Năm 450 Kỷ Nguyên Ma Thuật'). TUYỆT ĐỐI KHÔNG viết thành một đoạn văn miêu tả cảnh vật hay hành động của nhân vật. KHÔNG lấn sân sang kịch bản mở đầu.",
      starterScenario: "ĐẶC BIỆT LƯU Ý CHO MỤC KỊCH BẢN MỞ ĐẦU: Hãy viết một tóm tắt bối cảnh tình huống khởi đầu của người chơi. Tình thế hiện tại là gì? Đang gặp chuyện gì? CHÚ Ý: CHỈ LÀ TÓM TẮT ĐỊNH HƯỚNG KỊCH BẢN, không phải viết hẳn lời kể chuyện, không bao gồm mốc thời gian.",
      worldRules: "Chỉ viết về các quy luật tự nhiên, vật lý, hay phép thuật đặc thù của thế giới này. Không lấn sân sang các mục khác.",
      namingConventions: "Chỉ viết về phong cách và quy tắc đặt tên cho nhân vật, địa danh, vật phẩm trong thế giới này.",
      genre: "Chỉ liệt kê hoặc mô tả ngắn gọn về thể loại chính của trò chơi (VD: Cyberpunk, Tiên Hiệp, Isekai, v.v.).",
      mainMood: "Chỉ mô tả âm hưởng chủ đạo và cảm xúc mà thế giới này mang lại (VD: U ám, Bi tráng, Lãng mạn, Hài hước...).",
      pacing: "Chỉ mô tả nhịp độ diễn tiến của câu chuyện và các sự kiện trong thế giới.",
      geography: "Chỉ viết về đặc điểm địa lý, khí hậu, các vùng đất, và cảnh quan môi trường. Không bao gồm văn hóa hay lịch sử.",
      worldHistory: "Chỉ tóm tắt lịch sử hình thành, các cột mốc thời gian lớn trong quá khứ của thế giới. Không bao gồm tình hình hiện tại hay kịch bản mở đầu.",
      culture: "Chỉ mô tả về văn hóa, phong tục tập quán, ngôn ngữ, và lối sống của người dân bản địa.",
      economy: "Chỉ viết về hệ thống kinh tế, thương mại, tiền tệ, và cấu trúc giai cấp xã hội.",
      religion: "Chỉ mô tả hệ thống tôn giáo, tín ngưỡng, thần linh, và các nghi thức thờ cúng.",
      factions: "Chỉ liệt kê và tóm tắt về các quốc gia, thế lực, bang phái, hay tổ chức lớn trong thế giới.",
      factionRelations: "Chỉ mô tả các mối quan hệ (liên minh, thù địch, trung lập) giữa các thế lực đã nêu.",
      uniqueElements: "Chỉ liệt kê các yếu tố độc đáo, công nghệ đặc thù, hay sinh vật lạ chỉ có ở thế giới này.",
      powerSystem: "Chỉ mô tả chi tiết hệ thống sức mạnh, cấp bậc, cảnh giới, hoặc năng lực đặc biệt trong thế giới.",
      logicControl: "Chỉ nêu ra những giới hạn logic, những thứ tuyệt đối không tồn tại hoặc bị cấm trong thế giới này.",
      writingStyle: "ĐẶC BIỆT LƯU Ý CHO MỤC VĂN PHONG: Cần phân biệt rõ lối kể chuyện, văn phong giữa Phương Tây và Phương Đông, giữa Nhật Bản (Light novel/Isekai), Trung Quốc (Tiên Hiệp/Cổ trang) và Việt Nam. Cần phân biệt rõ từ Hán Việt phổ quát (dùng mọi bối cảnh) và từ Hán Việt mang sắc thái Cổ trang/Tiên hiệp (chỉ dùng cho bối cảnh phương Đông/Trung Quốc). Hãy quy định rõ cách sử dụng từ ngữ sao cho phù hợp với bối cảnh thế giới.",
      narrativePerspective: "Chỉ chỉ định ngôi kể của câu chuyện (ngôi thứ nhất, ngôi thứ hai, hoặc ngôi thứ ba) và góc nhìn tập trung vào đâu.",
    };

    const extraInstruction = fieldInstructions[fieldKey as string] 
      ? fieldInstructions[fieldKey as string] + "\n\n" 
      : "";

    const prompt = `Bạn là một AI chuyên gia sáng tạo kịch bản thế giới (World Building).\n\nDựa trên:\n- Ý tưởng sơ khai: "${initialIdea}"\n- Ý tưởng phát triển: "${developedIdea}"\n\nVà các thông tin thế giới hiện tại (nếu có):\n\`\`\`json\n${JSON.stringify(contextData, null, 2)}\n\`\`\`\n\nNhiệm vụ của bạn: Hãy phân tích các dữ liệu trên để sáng tạo nội dung mới thật hay, độc đáo, chi tiết, logic và liên kết chặt chẽ với các thông tin khác. ĐẶC BIỆT CHÚ Ý: BẠN CHỈ ĐƯỢC PHÉP VIẾT NỘI DUNG CHO DUY NHẤT MỤC: "${fieldName}". Tuyệt đối không được viết lan man, lấn sân sang các mục khác, không được viết thừa thãi những thứ không thuộc về tính chất của mục này.\n\n${currentFieldValue ? `LƯU Ý QUAN TRỌNG: Người chơi đã nhập sẵn nội dung cho mục này như sau: "${currentFieldValue}". Bạn BẮT BUỘC phải đọc và SÁNG TẠO/CẬP NHẬT THÊM để làm giàu nội dung cũ (nếu nó là dạng ý tưởng thì hãy phát triển, triển khai ý tưởng đó thành nội dung hoàn chỉnh), TUYỆT ĐỐI không được làm mất ý chính ban đầu.\n\n` : ""}${extraInstruction}LƯU Ý TỐI THƯỢNG: TRẢ VỀ TRỰC TIẾP NỘI DUNG (dạng text thuần túy), KHÔNG giải thích luyên thuyên, KHÔNG bọc trong markdown (như \`\`\`json), KHÔNG dùng thẻ <THINKING_PROCESS>.`;

    try {
      const result = aiService.generateStreamingContent(
        prompt,
        undefined,
        "Bạn là chuyên gia thiết kế thế giới game. Hãy tập trung và chỉ trả về đúng nội dung yêu cầu, tuyệt đối không tạo thẻ nội suy <THINKING_PROCESS> hay bất kỳ râu ria nào khác.",
      );

      let fullText = "";
      updateWorldCreation((draft) => {
        // @ts-ignore
        draft.worldData[fieldKey] = "";
      });

      for await (const chunk of result) {
        if (chunk.text) {
          fullText += chunk.text;
          const cleanText = fullText
            .replace(/<THINKING_PROCESS>[\s\S]*?<\/THINKING_PROCESS>/g, "")
            .replace(/```[\s\S]*?```/g, "")
            .trimStart();
          updateWorldCreation((draft) => {
            // @ts-ignore
            draft.worldData[fieldKey] = cleanText;
          });
        }
      }
      toast.success(`Đã tạo xong mục ${fieldName}`);
    } catch (error) {
      console.error(error);
      toast.error(`Lỗi khi tạo mục ${fieldName}`);
    } finally {
      setGeneratingFields((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        saveMenuRef.current &&
        !saveMenuRef.current.contains(event.target as Node)
      ) {
        setIsSaveMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isInitialIdeaCollapsed, setIsInitialIdeaCollapsed] = useState(() => {
    return localStorage.getItem("isInitialIdeaCollapsed") === "true";
  });
  const [isDevelopedIdeaCollapsed, setIsDevelopedIdeaCollapsed] = useState(
    () => {
      return localStorage.getItem("isDevelopedIdeaCollapsed") === "true";
    },
  );
  const [collapsedNpcs, setCollapsedNpcs] = useState<Record<number, boolean>>(
    {},
  );

  const toggleNpc = (idx: number) => {
    setCollapsedNpcs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    localStorage.setItem(
      "isInitialIdeaCollapsed",
      String(isInitialIdeaCollapsed),
    );
  }, [isInitialIdeaCollapsed]);

  useEffect(() => {
    localStorage.setItem(
      "isDevelopedIdeaCollapsed",
      String(isDevelopedIdeaCollapsed),
    );
  }, [isDevelopedIdeaCollapsed]);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setGenTimer(0);
      interval = setInterval(() => setGenTimer((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    let interval: any;
    if (isDevelopingIdea) {
      setDevTimer(0);
      interval = setInterval(() => setDevTimer((prev) => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isDevelopingIdea]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const contentRef = React.useRef<HTMLDivElement>(null);

  const scrollToTop = () =>
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
  const scrollToBottom = () =>
    contentRef.current?.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: "instant",
    });

  // Helper setters that update store
  const setInitialIdea = (val: string) =>
    updateWorldCreation({ initialIdea: val });
  const activeProxyId = useStore((state) => state.activeProxyId);
  const proxies = useStore((state) => state.proxies);

  const setDevelopedIdea = (val: string | ((p: string) => string)) => {
    updateWorldCreation((draft) => {
      draft.developedIdea =
        typeof val === "function" ? val(draft.developedIdea) : val;
    });
  };
  const setWorldData = (val: typeof worldData) =>
    updateWorldCreation({ worldData: val });
  const setMcData = (val: typeof mcData) =>
    updateWorldCreation({ mcData: val });
  const setMcsData = (val: typeof mcsData) =>
    updateWorldCreation({ mcsData: val });
  const setSelectedMcIndex = (val: number) =>
    updateWorldCreation({ selectedMcIndex: val });
  const setNpcs = (val: typeof npcs) => updateWorldCreation({ npcs: val });
  const setWorldDetails = (val: typeof worldDetails) =>
    updateWorldCreation({ worldDetails: val });

  const handleAIGenerate = async () => {
    if (!initialIdea.trim()) {
      toast.error("Vui lòng nhập ý tưởng sơ khai để AI có thể bắt đầu!");
      return;
    }

    setIsGenerating(true);
    setIsGeneratingStream(true);
    updateStreamData("");

    try {
      const systemInstruction = getWorldCreationSystemInstruction();

      const prompt = `Ý tưởng người chơi cung cấp:
- Ý tưởng sơ khai: "${initialIdea}"
- Ý tưởng đã phát triển: "${developedIdea}"

Dưới đây là các thông tin hiện tại trong các ô nhập liệu (nếu có nội dung, BẮT BUỘC phải đọc và phát triển, làm giàu, chi tiết hóa thêm nội dung cũ, tuyệt đối không được làm mất ý chính ban đầu. Nếu nội dung có dạng ý tưởng, hãy triển khai thành nội dung hoàn chỉnh. Nếu trống, hãy tự do sáng tạo):
\`\`\`json
{
  "worldData": ${JSON.stringify(worldData)},
  "mcData": ${JSON.stringify(mcData)},
  "npcs": ${JSON.stringify(npcs)},
  "worldDetails": ${JSON.stringify(worldDetails)}
}
\`\`\`

Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau:
{
  "worldData": { 
    "name": "Tên của câu chuyện / Tên tựa game (Tuyệt đối không phải tên lục địa/hành tinh/vũ trụ trong game)", 
    "difficulty": "Độ khó thực tế của cả bộ game (VD: Hardcore, Dễ thở). YẾU TỐ NÀY BẮT BUỘC SẼ CHI PHỐI TRỰC TIẾP tỉ lệ thành công, thất bại, rủi ro trong MỌI HÀNH ĐỘNG của người chơi (dù là chọn gợi ý hay tự nhập).",
    "background": "Bối cảnh thế giới chi tiết", 
    "starterTimeline": "Mốc thời gian mở đầu cụ thể (BẮT BUỘC ĐẢM BẢO LOGIC VỚI NĂM SINH NHÂN VẬT, BẮT BUỘC BAO GỒM GIỜ, PHÚT, THỨ, NGÀY, THÁNG, NĂM. Nếu bối cảnh hiện đại không rõ năm, BẮT BUỘC dùng năm 2026)", 
    "starterScenario": "Kịch bản mở đầu lôi cuốn", 
    "worldRules": "Quy tắc, luật lệ, cấm kỵ của thế giới",
    "namingConventions": "Quy tắc đặt tên cho nhân vật, địa danh, vật phẩm (Ví dụ: phong cách Nhật Bản trung cổ, Cyberpunk, v.v.)",
    "genre": "Thể loại",
    "mainMood": "Âm hưởng chủ đạo (Main Mood & Aesthetic)",
    "pacing": "Nhịp độ (Pacing)",
    "geography": "Địa lý & Vùng lãnh thổ",
    "worldHistory": "Lịch sử thế giới",
    "culture": "Văn hóa & Phong tục",
    "economy": "Kinh tế & Xã hội",
    "religion": "Tôn giáo & Tín ngưỡng",
    "factions": "Các quốc gia & Thế lực",
    "factionRelations": "Mối quan hệ thế lực",
    "uniqueElements": "Các yếu tố độc đáo",
    "powerSystem": "Hệ thống sức mạnh / Logic phân bậc",
    "logicControl": "Kiểm soát Logic & Yếu tố loại trừ",
    "writingStyle": "Văn Phong (Mô tả chi tiết văn phong chủ đạo của thế giới này. BẮT BUỘC ĐIỀU CHỈNH CÁCH DÙNG TỪ CHO ĐÚNG BỐI CẢNH: Nếu là bối cảnh Fantasy/Isekai/Phương Tây/Hiện đại, TUYỆT ĐỐI KHÔNG dùng và không đề cập đến các từ ngữ Hán Việt mang sắc thái Tiên Hiệp/Kiếm Hiệp/Cổ Trang Phương Đông. Chỉ sử dụng từ thuần Việt hoặc từ Hán Việt thông dụng phổ quát phù hợp ngữ cảnh)",
    "narrativePerspective": "Ngôi Kể"
  },
  "mcData": {
    "name": "Tên gọi", 
    "fullName": "Họ và Tên đầy đủ", 
    "titles": "Danh xưng, Tước hiệu", 
    "occupation": "Chức vụ, Nghề nghiệp", 
    "gender": "Giới tính", 
    "age": "Tuổi tác (cho phép ghi thêm mô tả vào, VD: '500 tuổi (trông như thiếu nữ 18 trẻ đẹp)'; hoặc dùng văn học đối với thần thánh không xác định tuổi, VD: 'Thuở sơ khai trường tồn cùng thiên địa'. ĐẢM BẢO LOGIC VỚI MỐC THỜI GIAN VÀ NĂM SINH)", 
    "dob": "Ngày tháng năm sinh (BẮT BUỘC có đầy đủ ngày, tháng và NĂM SINH. Liên kết logic 100% với Tuổi tác và Mốc thời gian mở đầu)", 
    "rank": "Cấu trúc Cảnh giới hoặc Chỉ số", 
    "height": "Chiều cao", 
    "weight": "Cân nặng", 
    "measurements": "Số đo 3 vòng và Cỡ ngực (Ghi chú số đo cụ thể, VD: 90-60-90 (Cup D), SAU ĐÓ KÈM THEO phần nội dung miêu tả rõ và ngắn gọn về cơ thể dựa theo số đo, chiều cao và cân nặng để cho biết rõ ngực, eo, mông trông như thế nào, dáng người ra sao) / Thể hình (Nam)", 
    "appearance": "Miêu tả ngoại hình bẩm sinh (NSFW, dùng từ trực diện không ẩn dụ. Nữ: Dựa theo tính cách, chiều cao, cân nặng, số đo 3 vòng để tả cơ thể chính xác, không phô dâm. Nam: Liên kết tính cách, chiều cao, cân nặng, BẮT BUỘC tả dương vật khi bình thường và khi cương cứng hết mức)", 
    "distinguishingFeatures": "Đặc trưng nhận diện phụ (Ví dụ: các yếu tố tự nhiên như răng khểnh, má lúm, nốt ruồi hay các yếu tố không tự nhiên như vết sẹo, hình xăm, vết bớt, nhuộm tóc... và rất nhiều đặc điểm bên ngoài khác nữa)", 
    "powers": [{"name": "Tên năng lực/sức mạnh", "description": "Mô tả chi tiết năng lực", "type": "Loại năng lực", "level": "Cấp độ (nếu có)"}], 
    "skills": [{"name": "Tên kỹ năng", "description": "Mô tả chi tiết", "type": "Loại kỹ năng", "level": "Độ thuần thục"}], 
    "personality": "Tính cách tổng quan bên ngoài", 
    "personalityCore": "Bản ngã cốt lõi tận cùng của tâm hồn", 
    "philosophy": "Triết lý sống, tín ngưỡng cá nhân", 
    "goal": "Mục tiêu tối thượng", 
    "background": "Nguồn gốc, Xuất thân, Hoàn cảnh khởi đầu", 
    "innerSecret": "Những bí mật sâu kín", 
    "loveViews": "Quan niệm về ái tình, sự chung thủy, tình dục", 
    "experience": "Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)", 
    "nsfwPersonality": "Bản chất khi NSFW (dâm đãng, thẹn thùng, thống trị, phục tùng)", 
    "nsfwReactions": "Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích", 
    "literaryDescription": "Ngoại hình và chân dung văn học khởi đầu hoàn chỉnh cúa MC (Cấm viết spoil diễn biến sắp xảy ra)",
    "inventory": [{
      "name": "Tên vật phẩm",
      "quantity": 1,
      "description": "Mô tả công năng / Đặc điểm"
    }]
  },
  "npcs": [{
    "LƯU_Ý_TỐI_THƯỢNG": "ĐIỀN ĐỦ 100% CÁC TRƯỜNG DƯỚI ĐÂY, NGHIÊM CẤM BỎ TRỐNG, KHÔNG DÙNG 'N/A' HAY '...'. PHẢI SÁNG TẠO ĐẦY ĐỦ. ĐẶC BIỆT: CẤM SPOIL TƯƠNG LAI!",
    "name": "Tên NPC", 
    "fullName": "Họ và tên NPC", 
    "titles": "Danh xưng, Tước hiệu", 
    "occupation": "Chức vụ, Vai trò", 
    "role": "Vai trò (Vd: Kẻ Địch, Hỗ trợ)",
    "background": "Lai lịch (lồng ghép binh khí, đan dược nếu có). CẤM SPOIL CỐT TRUYỆN MỚI!",
    "gender": "Giới tính", 
    "age": "Tuổi tác (cho phép ghi thêm mô tả vào, VD: '500 tuổi (trông như thiếu nữ 18 trẻ đẹp)'; hoặc dùng văn học đối với thần thánh không xác định tuổi, VD: 'Thuở sơ khai trường tồn cùng thiên địa'. ĐẢM BẢO LOGIC VỚI MỐC THỜI GIAN VÀ NĂM SINH)", 
    "dob": "Ngày tháng năm sinh (BẮT BUỘC có đầy đủ ngày, tháng và NĂM SINH. Liên kết logic 100% với Tuổi tác và Mốc thời gian mở đầu)", 
    "rank": "Cảnh giới, Cấp độ", 
    "height": "Chiều cao", 
    "weight": "Cân nặng", 
    "measurements": "Số đo 3 vòng và Cỡ ngực (Ghi chú số đo cụ thể, VD: 90-60-90 (Cup D), SAU ĐÓ KÈM THEO phần nội dung miêu tả rõ và ngắn gọn về cơ thể dựa theo số đo, chiều cao và cân nặng để cho biết rõ ngực, eo, mông trông như thế nào, dáng người ra sao) / Thể hình (Nam)", 
    "appearance": "Miêu tả ngoại hình tổng quan (NSFW, dùng từ trực diện không ẩn dụ. Nữ: Dựa theo tính cách, chiều cao, cân nặng, số đo 3 vòng để tả cơ thể chính xác, không phô dâm. Nam: Liên kết tính cách, chiều cao, cân nặng, BẮT BUỘC tả dương vật khi bình thường và khi cương cứng hết mức)", 
    "appearanceLite": "Miêu tả tóm tắt ngắn gọn ngoại hình bề ngoài một cách an toàn và trong sáng (SFW). BẮT BUỘC DÀI TỐI THIỂU 200 CHỮ, CHIA LÀM ÍT NHẤT 2 ĐOẠN (dùng \\n\\n) VÀ CÓ ÍT NHẤT 2 BỘ TRANG PHỤC KHÁC NHAU",
    "powers": [{"name": "Tên năng lực/sức mạnh", "description": "Mô tả chi tiết năng lực", "type": "Loại năng lực", "level": "Cấp độ (nếu có)"}], 
    "skills": [{"name": "Tên kỹ năng", "description": "Mô tả chi tiết", "type": "Loại kỹ năng", "level": "Độ thuần thục"}], 
    "personality": "Tính cách tổng quan (Thể hiện bên ngoài)", 
    "personalityCore": "Bản ngã cốt lõi tận cùng của tâm hồn (Cấm thêm suy diễn sự kiện cốt truyện tương lai vào đây)", 
    "philosophy": "Triết lý sống, tín ngưỡng cá nhân", 
    "goal": "Mục tiêu đời người NPC đang theo đuổi", 
    "needs": "Nhu cầu (gồm SFW và NSFW). AI đã được bổ sung kiến thức để tự động phân tích và tạo ra tối thiểu 2 nhu cầu đa dạng cho NPC dựa trên tính cách và bối cảnh như sau: Nhu cầu cơ bản/đời thường: Bao gồm các nhu cầu như ăn uống (do đói, thèm), đi chơi, giải trí, mua sắm. Nhu cầu tình cảm: Khát khao tình cảm gia đình, bạn bè, nam nữ/trai gái, cần sự quan tâm chở che hay thấu hiểu. Nhu cầu sinh tồn/quyền lực (tùy bối cảnh): Nhu cầu cần thức ăn, chỗ dựa vững chắc (trong thế giới mạt thế), hoặc nhu cầu thao túng, chiếm đoạt tài sản, kiểm soát người khác (trong bối cảnh tranh đấu, chính trị). Nhu cầu tình dục (NSFW): Từ việc chỉ đơn giản là muốn thỏa mãn sinh lý đến những khao khát/sở thích rất cụ thể trong tình dục. AI sẽ tự động lồng ghép và đề xuất ít nhất 2 nhu cầu (không có giới hạn tối đa) được miêu tả cẩn thận bằng văn học trong quá trình khởi tạo hoặc làm mới NPC.",
    "distinguishingFeatures": "Đặc trưng nhận diện phụ (Ví dụ: các yếu tố tự nhiên như răng khểnh, má lúm, nốt ruồi hay các yếu tố không tự nhiên như vết sẹo, hình xăm, vết bớt, nhuộm tóc... và rất nhiều đặc điểm bên ngoài khác nữa)", 
    "innerSecret": "Những bí mật sâu kín NPC che giấu", 
    "relationships": [{"name": "Họ và tên đầy đủ của nhân vật", "relation": "Mối quan hệ", "status": "Tình trạng", "impression": "Ấn tượng và suy nghĩ chi tiết về đối phương (BẮT BUỘC PHẢI ĐIỀN ĐẦY ĐỦ, CẤM BỎ TRỐNG)", "termsOfAddress": ["Cách xưng hô 1 (BẮT BUỘC)", "Cách xưng hô 2"], "selfAppellation": ["Cách tự xưng 1 (BẮT BUỘC)", "Cách tự xưng 2"], "description": "Mô tả chi tiết. LƯU Ý TỐI THƯỢNG: NẾU CHƯA TỪNG GẶP/CHƯA QUEN BIẾT THÌ NGHIÊM CẤM TẠO LIÊN KẾT QUAN HỆ TRONG MẢNG NÀY (Tuyệt đối không tạo kiểu 'Người lạ', 'Chưa gặp mặt'. Rất vô lý và spoil. Hãy để mảng trống [] nếu không quen ai)"}], 
    "loveViews": "Quan điểm về ái tình, sự chung thủy, tình dục", 
    "experience": "Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)", 
    "nsfwPersonality": "Bản chất khi NSFW (dâm đãng, thẹn thùng, thống trị, phục tùng)", 
    "nsfwReactions": "Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích", 
    "preferences": {
      "sfw": "Sở thích, ghét, nỗi sợ ở chế độ SFW",
      "nsfw": "Sở thích, ghét, nỗi sợ ở chế độ NSFW"
    },
    "literaryDescription": "Chân dung văn học khắc họa NPC ban đầu (Tuyệt đối không chèn tiên tri / spoil diễn biến truyện vào phần chân dung này). BẮT BUỘC CÓ THÊM 1 ĐOẠN ĐỂ KỂ VỀ CÁC VẬT PHẨM, TÀI SẢN CỦA NPC."
  }],
  "worldDetails": {
    "places": "Mô tả chi tiết các địa điểm quan trọng hoặc những nơi các nhân vật sẽ xuất hiện hoặc đi đến bước đầu",
    "locations": [{
      "name": "Tên địa điểm (từ lớn đến nhỏ, có thể kết hợp cấp bậc Vd: Trường học - Phòng y tế)",
      "description": "Mô tả chi tiết nơi đó có gì và trông như thế nào. TUYỆT ĐỐI KHÔNG đề cập đến nhân vật nào ở đây."
    }]
  }
}

LƯU Ý QUAN TRỌNG: NẾU NGƯỜI CHƠI CHỈ NHẬP Ý TƯỞNG SƠ KHAI MÀ KHÔNG NHẬP CÁC THÔNG TIN KHÁC, BẠN PHẢI TỰ ĐỘNG SÁNG TẠO 100% (GHI ĐÈ LÊN CÁC TRƯỜNG DỮ LIỆU CŨ NẾU NÓ KHÔNG PHÙ HỢP VỚI Ý TƯỞNG MỚI NÀY, ĐẶC BIỆT LÀ CÁC NPC CỦA THẾ GIỚI CŨ). ĐẶC BIỆT LƯU Ý VỀ SỐ LƯỢNG NPC VÀ LOCATIONS: Bạn BẮT BUỘC phải tạo ra ĐỦ số lượng NPC và Location như được yêu cầu trong phần ý tưởng sơ khai (hoặc ít nhất 3 NPC và 3 Location nếu không chỉ định rõ số lượng). Nếu trong cục JSON người chơi cung cấp có số lượng NPC ít hơn yêu cầu, bạn PHẢI TỰ ĐỘNG TẠO THÊM các NPC mới để bù đắp vào mảng npcs cho đủ số lượng. Khi tạo thêm, phải điền đầy đủ 100% tất cả các trường dữ liệu. ĐỐI VỚI MẢNG "relationships" CỦA NPC: BẮT BUỘC điền đầy đủ chi tiết cho cả 3 mục nhỏ là "impression" (Ấn tượng và suy nghĩ), "termsOfAddress" (Mảng các cách xưng hô thường dùng) và "selfAppellation" (Mảng cách tự xưng bản thân), nghiêm cấm lười biếng bỏ qua! Đối với "locations": "Location sẽ chỉ liệt kê các địa điểm từ lớn đến nhỏ và mô tả về nơi đó có gì và trông như thế nào, KHÔNG MANG CÁC NHÂN VẬT VÀO NÓI Ở ĐÂY."`;

      const result = aiService.generateStreamingContent(
        prompt,
        undefined,
        systemInstruction,
      );

      let fullText = "";

      for await (const chunk of result) {
        if (chunk.thought) {
          updateStreamData((prev) => prev + chunk.thought);
        }
        if (chunk.text) {
          fullText += chunk.text;
          updateStreamData((prev) => prev + chunk.text);
        }
      }

      // Sau khi stream xong, cố gắng parse JSON để cập nhật UI
      try {
        const data = safeParseJSON(fullText);
        if (data) {
          if (data.worldData) setWorldData(data.worldData);
          if (data.mcData) setMcData(data.mcData);
          if (data.npcs) setNpcs(data.npcs);
          if (data.worldDetails) setWorldDetails(data.worldDetails);
          toast.success("Matrix Lite v4 đã sẵn sàng!");
        }
      } catch (parseError) {
        console.warn(
          "Could not parse AI response as JSON perfectly, but stream completed.",
          parseError,
        );
        toast.info(
          "Có lỗi định dạng do độ dài nội dung, AI chưa cấu trúc đủ dữ liệu.",
        );
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      useStore
        .getState()
        .setSystemLogs(
          `[LỖI TẠO THẾ GIỚI - ${new Date().toLocaleTimeString()}] ${error?.message || error}\n\n`,
        );
      toast.error("AI đang bận hoặc gặp lỗi. Vui lòng thử lại sau!");
    } finally {
      setIsGenerating(false);
      setIsGeneratingStream(false);
    }
  };

  const handleDevelopIdea = async () => {
    if (!initialIdea.trim()) {
      toast.error("Vui lòng nhập ý tưởng sơ khai!");
      return;
    }

    setIsDevelopingIdea(true);
    setIsGeneratingStream(true);
    updateStreamData(
      ">>> Đang kích hoạt Deep Reasoning Matrix...\n>>> Phân tích ý tưởng sơ khai...\n>>> Kết nối Gemini 3.1 Pro (High Thinking) để phát triển ý tưởng...\n\n",
    );

    try {
      const systemInstruction = getIdeaDeveloperSystemInstruction();
      const prompt = `Từ ý tưởng sơ khai dưới đây:
"${initialIdea}"

${developedIdea ? `LƯU Ý QUAN TRỌNG: Hiện tại ô Ý tưởng phát triển đang có sẵn nội dung sau: "${developedIdea}". Bạn BẮT BUỘC phải đọc và SÁNG TẠO/CẬP NHẬT THÊM để làm giàu nội dung cũ (nếu nó là dạng ý tưởng thì hãy phát triển, triển khai ý tưởng đó thành nội dung hoàn chỉnh), TUYỆT ĐỐI không được làm mất ý chính ban đầu.\n\n` : ""}Hãy tiến hành suy nghĩ trong thẻ <THINKING_PROCESS> và phát triển nó thành một ý tưởng chi tiết, sâu sắc, bao gồm bối cảnh, mâu thuẫn chính và nét độc đáo của thế giới này. 
Hãy trình bày một cách cuốn hút và logic. BẮT BUỘC TRẢ LỜI VÀ SUY NGHĨ TOÀN BỘ BẰNG TIẾNG VIỆT 100%.`;

      const result = aiService.generateStreamingContent(
        prompt,
        undefined,
        systemInstruction,
      );

      let fullText = "";
      let hasText = false;
      let thoughtBuffer = "";
      setDevelopedIdea("");
      for await (const chunk of result) {
        if (chunk.thought) {
          thoughtBuffer += chunk.thought;
          updateStreamData((prev) => prev + chunk.thought);
        }
        if (chunk.text) {
          hasText = true;
          fullText += chunk.text;
          // Loại bỏ thinking process khi hiển thị kết quả cuối
          const cleanText = fullText
            .replace(/<THINKING_PROCESS>[\s\S]*?<\/THINKING_PROCESS>/g, "")
            .trim();
          setDevelopedIdea(cleanText || fullText);
          updateStreamData((prev) => prev + chunk.text);
        }
      }
      if (!hasText && thoughtBuffer) {
        // Fallback in case the model generated the entire output inside the "thought" section
        setDevelopedIdea(thoughtBuffer);
      }
      toast.success("Ý tưởng đã được phát triển thành công!");
    } catch (error: any) {
      console.error("Develop Idea Error:", error);
      useStore
        .getState()
        .setSystemLogs(
          `[LỖI PHÁT TRIỂN Ý TƯỞNG - ${new Date().toLocaleTimeString()}] ${error?.message || error}\n\n`,
        );
      toast.error("Lỗi khi phát triển ý tưởng.");
    } finally {
      setIsDevelopingIdea(false);
      setIsGeneratingStream(false);
    }
  };

  const handleGenerateMC = async () => {
    if (!mcIdea.trim() && !initialIdea.trim()) {
      toast.error("Vui lòng nhập ý tưởng MC hoặc ý tưởng sơ khai chung!");
      return;
    }

    setIsGeneratingMc(true);
    setIsGeneratingStream(true);
    updateStreamData(">>> Đang phân tích ý tưởng MC...\n\n");

    try {
      const systemInstruction = getWorldCreationSystemInstruction();

      const prompt = `Ý tưởng người chơi cung cấp:
- Ý tưởng sơ khai chung của thế giới: "${initialIdea}"
- Ý tưởng đã phát triển: "${developedIdea}"
- Ý tưởng dành riêng cho việc tạo MC: "${mcIdea}"

Dưới đây là các thông tin hiện tại trong các ô nhập liệu (nếu có nội dung, BẮT BUỘC phải đọc và phát triển, làm giàu, chi tiết hóa thêm nội dung cũ, tuyệt đối không được làm mất ý chính ban đầu. Nếu nội dung có dạng ý tưởng, hãy triển khai thành nội dung hoàn chỉnh. Nếu trống, hãy tự do sáng tạo). Hãy phân tích kỹ BỐI CẢNH THẾ GIỚI (worldData, worldDetails) và CÁC NHÂN VẬT ĐÃ CÓ (mcData, mcsData, npcs) để tạo ra nhân vật sao cho thật ăn khớp:
\`\`\`json
{
  "worldData": ${JSON.stringify(worldData)},
  "worldDetails": ${JSON.stringify(worldDetails)},
  "mcsData": ${JSON.stringify(mcsData)},
  "mcData": ${JSON.stringify(mcData)},
  "npcs": ${JSON.stringify(npcs)}
}
\`\`\`

Dựa vào ý tưởng dành riêng cho MC và BỐI CẢNH TỔNG THỂ ở trên, hãy thiết kế và TẠO MỚI các phiên bản nhân vật chính (MC) theo yêu cầu. BẮT BUỘC KHÔNG TÍNH CÁC MC ĐÃ CÓ VÀO SỐ LƯỢNG YÊU CẦU TẠO (ví dụ: nếu yêu cầu tạo 3 MC, hãy tạo ra đúng 3 MC mới hoàn toàn). Nếu người chơi yêu cầu tạo nhiều phiên bản MC khác nhau, hãy tạo đủ số lượng đó. Nếu không nói rõ số lượng, hãy tạo ra 1 MC hoàn chỉnh nhất.
Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau:
{
  "mcsData": [{
    "name": "Tên gọi", 
    "fullName": "Họ và Tên đầy đủ", 
    "titles": "Danh xưng, Tước hiệu", 
    "occupation": "Chức vụ, Nghề nghiệp", 
    "gender": "Giới tính", 
    "age": "Tuổi tác (ĐẢM BẢO LOGIC VỚI MỐC THỜI GIAN VÀ NĂM SINH)", 
    "dob": "Ngày tháng năm sinh (BẮT BUỘC có đầy đủ ngày, tháng và NĂM SINH)", 
    "rank": "Cấu trúc Cảnh giới hoặc Chỉ số", 
    "height": "Chiều cao", 
    "weight": "Cân nặng", 
    "measurements": "Số đo 3 vòng và Cỡ ngực / Thể hình (Nam)", 
    "appearance": "Miêu tả ngoại hình bẩm sinh (NSFW)", 
    "distinguishingFeatures": "Đặc trưng nhận diện phụ", 
    "powers": [{"name": "Tên năng lực/sức mạnh", "description": "Mô tả chi tiết năng lực", "type": "Loại năng lực", "level": "Cấp độ (nếu có)"}], 
    "skills": [{"name": "Tên kỹ năng", "description": "Mô tả chi tiết", "type": "Loại kỹ năng", "level": "Độ thuần thục"}], 
    "personality": "Tính cách tổng quan bên ngoài", 
    "personalityCore": "Bản ngã cốt lõi tận cùng của tâm hồn", 
    "philosophy": "Triết lý sống, tín ngưỡng cá nhân", 
    "goal": "Mục tiêu tối thượng", 
    "background": "Nguồn gốc, Xuất thân, Hoàn cảnh khởi đầu", 
    "innerSecret": "Những bí mật sâu kín", 
    "loveViews": "Quan niệm về ái tình, sự chung thủy, tình dục", 
    "experience": "Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)", 
    "nsfwPersonality": "Bản chất khi NSFW", 
    "nsfwReactions": "Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích", 
    "literaryDescription": "Ngoại hình và chân dung văn học khởi đầu hoàn chỉnh cúa MC",
    "inventory": [{
      "name": "Tên vật phẩm",
      "quantity": 1,
      "description": "Mô tả công năng / Đặc điểm"
    }]
  }]
}
LƯU Ý QUAN TRỌNG: Hãy sáng tạo thật chi tiết dựa trên ý tưởng MC. PHẢI TẠO ĐẦY ĐỦ THÔNG TIN, KHÔNG BỎ TRỐNG BẤT KỲ TRƯỜNG NÀO.`;

      const result = aiService.generateStreamingContent(prompt, undefined, systemInstruction);
      let fullText = "";

      for await (const chunk of result) {
        if (chunk.thought) updateStreamData((prev) => prev + chunk.thought);
        if (chunk.text) {
          fullText += chunk.text;
          updateStreamData((prev) => prev + chunk.text);
        }
      }

      try {
        const data = safeParseJSON(fullText);
        if (data) {
          if (data.mcsData && Array.isArray(data.mcsData) && data.mcsData.length > 0) {
            const newMcsData = [...mcsData, ...data.mcsData];
            setMcsData(newMcsData);
            if (newMcsData.length > 1) {
              setSelectedMcIndex(-1);
              toast.success(`Đã tạo và thêm ${data.mcsData.length} phiên bản MC thành công! Vui lòng chọn 1 phiên bản.`);
            } else {
              setMcData(newMcsData[0]);
              setSelectedMcIndex(0);
              toast.success(`Đã tạo 1 phiên bản MC thành công!`);
            }
          } else if (data.mcData) {
            // fallback
            const newMcsData = [...mcsData, data.mcData];
            setMcsData(newMcsData);
            if (newMcsData.length > 1) {
              setSelectedMcIndex(-1);
              toast.success(`Đã tạo và thêm 1 phiên bản MC thành công! Vui lòng chọn 1 phiên bản.`);
            } else {
              setMcData(newMcsData[0]);
              setSelectedMcIndex(0);
              toast.success("Đã tạo MC thành công!");
            }
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi phân tích cú pháp JSON cho MC.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gặp lỗi trong quá trình tạo MC.");
    } finally {
      setIsGeneratingMc(false);
      setIsGeneratingStream(false);
    }
  };

  const handleGenerateNPCs = async () => {
    if (!npcIdea.trim() && !initialIdea.trim()) {
      toast.error("Vui lòng nhập ý tưởng NPCs hoặc ý tưởng sơ khai chung!");
      return;
    }

    setIsGeneratingNpc(true);
    setIsGeneratingStream(true);
    updateStreamData(">>> Đang phân tích ý tưởng NPCs...\n\n");

    try {
      const systemInstruction = getWorldCreationSystemInstruction();

      const prompt = `Ý tưởng người chơi cung cấp:
- Ý tưởng sơ khai chung của thế giới: "${initialIdea}"
- Ý tưởng đã phát triển: "${developedIdea}"
- Ý tưởng dành riêng cho việc tạo NPCs: "${npcIdea}"

Dưới đây là các thông tin hiện tại trong các ô nhập liệu (nếu có nội dung, BẮT BUỘC phải đọc và phát triển, làm giàu, chi tiết hóa thêm nội dung cũ, tuyệt đối không được làm mất ý chính ban đầu. Nếu nội dung có dạng ý tưởng, hãy triển khai thành nội dung hoàn chỉnh. Nếu trống, hãy tự do sáng tạo). Hãy phân tích kỹ BỐI CẢNH THẾ GIỚI (worldData, worldDetails) và CÁC NHÂN VẬT ĐÃ CÓ (mcData, mcsData, npcs) để tạo ra nhân vật sao cho thật ăn khớp:
\`\`\`json
{
  "worldData": ${JSON.stringify(worldData)},
  "worldDetails": ${JSON.stringify(worldDetails)},
  "mcsData": ${JSON.stringify(mcsData)},
  "mcData": ${JSON.stringify(mcData)},
  "npcs": ${JSON.stringify(npcs)}
}
\`\`\`

Dựa vào ý tưởng dành riêng cho NPCs và BỐI CẢNH TỔNG THỂ ở trên, hãy thiết kế và tạo mới các nhân vật phụ (NPCs). 
BẮT BUỘC KHÔNG ĐƯỢC TRÙNG TÊN VỚI CÁC NPC ĐÃ CÓ TRONG DANH SÁCH (nếu có).
Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau:
{
  "newNpcs": [{
    "LƯU_Ý_TỐI_THƯỢNG": "ĐIỀN ĐỦ 100% CÁC TRƯỜNG DƯỚI ĐÂY, NGHIÊM CẤM BỎ TRỐNG",
    "name": "Tên NPC (Phải khác với các NPC hiện tại)", 
    "fullName": "Họ và tên NPC", 
    "titles": "Danh xưng, Tước hiệu", 
    "occupation": "Chức vụ, Vai trò", 
    "role": "Vai trò",
    "background": "Lai lịch",
    "gender": "Giới tính", 
    "age": "Tuổi tác", 
    "dob": "Ngày tháng năm sinh", 
    "rank": "Cảnh giới, Cấp độ", 
    "height": "Chiều cao", 
    "weight": "Cân nặng", 
    "measurements": "Số đo 3 vòng và Cỡ ngực / Thể hình (Nam)", 
    "appearance": "Miêu tả ngoại hình tổng quan (NSFW)", 
    "appearanceLite": "Miêu tả tóm tắt ngắn gọn ngoại hình bề ngoài (SFW). BẮT BUỘC DÀI TỐI THIỂU 200 CHỮ",
    "powers": [{"name": "Tên năng lực/sức mạnh", "description": "Mô tả chi tiết năng lực", "type": "Loại năng lực", "level": "Cấp độ (nếu có)"}], 
    "skills": [{"name": "Tên kỹ năng", "description": "Mô tả chi tiết", "type": "Loại kỹ năng", "level": "Độ thuần thục"}], 
    "personality": "Tính cách tổng quan (Thể hiện bên ngoài)", 
    "personalityCore": "Bản ngã cốt lõi tận cùng của tâm hồn", 
    "philosophy": "Triết lý sống, tín ngưỡng cá nhân", 
    "goal": "Mục tiêu đời người NPC đang theo đuổi", 
    "needs": "Nhu cầu (gồm SFW và NSFW)",
    "distinguishingFeatures": "Đặc trưng nhận diện phụ", 
    "innerSecret": "Những bí mật sâu kín NPC che giấu", 
    "relationships": [{"name": "Họ và tên đầy đủ của nhân vật", "relation": "Mối quan hệ", "status": "Tình trạng", "impression": "Ấn tượng và suy nghĩ", "termsOfAddress": ["Cách xưng hô 1"], "selfAppellation": ["Cách tự xưng 1"], "description": "Mô tả chi tiết"}], 
    "loveViews": "Quan điểm về ái tình, sự chung thủy, tình dục", 
    "experience": "Kinh nghiệm tình trường", 
    "nsfwPersonality": "Bản chất khi NSFW", 
    "nsfwReactions": "Phản ứng cơ thể", 
    "preferences": {
      "sfw": "Sở thích, ghét, nỗi sợ ở chế độ SFW",
      "nsfw": "Sở thích, ghét, nỗi sợ ở chế độ NSFW"
    },
    "literaryDescription": "Chân dung văn học khắc họa NPC ban đầu."
  }]
}
LƯU Ý QUAN TRỌNG: Hãy tạo ra ĐỦ số lượng NPC như được yêu cầu trong phần ý tưởng NPCs. PHẢI TẠO ĐẦY ĐỦ THÔNG TIN, KHÔNG BỎ TRỐNG BẤT KỲ TRƯỜNG NÀO. ĐỐI VỚI MẢNG "relationships" CỦA NPC: BẮT BUỘC điền đầy đủ chi tiết cho cả 3 mục nhỏ là "impression", "termsOfAddress" và "selfAppellation".`;

      const result = aiService.generateStreamingContent(prompt, undefined, systemInstruction);
      let fullText = "";

      for await (const chunk of result) {
        if (chunk.thought) updateStreamData((prev) => prev + chunk.thought);
        if (chunk.text) {
          fullText += chunk.text;
          updateStreamData((prev) => prev + chunk.text);
        }
      }

      try {
        const data = safeParseJSON(fullText);
        if (data) {
          if (data.newNpcs && Array.isArray(data.newNpcs)) {
            setNpcs([...npcs, ...data.newNpcs]);
            toast.success(`Đã tạo và thêm ${data.newNpcs.length} NPCs thành công!`);
          } else if (data.npcs && Array.isArray(data.npcs)) {
            // fallback if it uses "npcs"
            setNpcs([...npcs, ...data.npcs]);
            toast.success(`Đã tạo và thêm ${data.npcs.length} NPCs thành công!`);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi phân tích cú pháp JSON cho NPCs.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gặp lỗi trong quá trình tạo NPCs.");
    } finally {
      setIsGeneratingNpc(false);
      setIsGeneratingStream(false);
    }
  };

  const handleGenerateLocation = async () => {
    if (!locationIdea.trim() && !initialIdea.trim()) {
      toast.error("Vui lòng nhập ý tưởng Location hoặc ý tưởng sơ khai chung!");
      return;
    }

    setIsGeneratingLocation(true);
    setIsGeneratingStream(true);
    updateStreamData(">>> Đang phân tích ý tưởng Location...\n\n");

    try {
      const systemInstruction = getWorldCreationSystemInstruction();

      const prompt = `Ý tưởng người chơi cung cấp:
- Ý tưởng sơ khai chung của thế giới: "${initialIdea}"
- Ý tưởng đã phát triển: "${developedIdea}"
- Ý tưởng dành riêng cho việc tạo Location: "${locationIdea}"

Dưới đây là các thông tin hiện tại trong các ô nhập liệu (nếu có nội dung, BẮT BUỘC phải đọc và phát triển, làm giàu, chi tiết hóa thêm nội dung cũ, tuyệt đối không được làm mất ý chính ban đầu. Nếu nội dung có dạng ý tưởng, hãy triển khai thành nội dung hoàn chỉnh. Nếu trống, hãy tự do sáng tạo). Hãy phân tích kỹ BỐI CẢNH THẾ GIỚI (worldData, worldDetails) để tạo ra các địa điểm sao cho thật ăn khớp. KHÔNG ĐƯỢC MANG NHÂN VẬT VÀO MÔ TẢ ĐỊA ĐIỂM:
\`\`\`json
{
  "worldData": ${JSON.stringify(worldData)},
  "worldDetails": ${JSON.stringify(worldDetails)}
}
\`\`\`

Dựa vào ý tưởng dành riêng cho Location và BỐI CẢNH TỔNG THỂ ở trên, hãy thiết kế và tạo mới các địa điểm (Location).
LƯU Ý QUAN TRỌNG TỪ NGƯỜI CHƠI: "Location sẽ chỉ liệt kê các địa điểm từ lớn đến nhỏ (ví dụ ở nhà thì trong nhà có nơi nào và phòng gì, ở trường thì trong trường có nơi nào và phòng gì) và mô tả về nơi đó có gì và trông như thế nào, KHÔNG MANG CÁC NHÂN VẬT VÀO NÓI Ở ĐÂY."
BẮT BUỘC KHÔNG ĐƯỢC TRÙNG TÊN VỚI CÁC LOCATION ĐÃ CÓ TRONG DANH SÁCH (nếu có).
Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau:
{
  "newLocations": [{
    "name": "Tên địa điểm (từ lớn đến nhỏ, có thể kết hợp cấp bậc Vd: Trường học - Phòng y tế)", 
    "description": "Mô tả chi tiết nơi đó có gì và trông như thế nào. TUYỆT ĐỐI KHÔNG đề cập đến nhân vật nào ở đây."
  }]
}
LƯU Ý QUAN TRỌNG: Hãy tạo ra ĐỦ số lượng Location như được yêu cầu trong phần ý tưởng Location. PHẢI TẠO ĐẦY ĐỦ THÔNG TIN, KHÔNG BỎ TRỐNG BẤT KỲ TRƯỜNG NÀO.`;

      const result = aiService.generateStreamingContent(prompt, undefined, systemInstruction);
      let fullText = "";

      for await (const chunk of result) {
        if (chunk.thought) updateStreamData((prev) => prev + chunk.thought);
        if (chunk.text) {
          fullText += chunk.text;
          updateStreamData((prev) => prev + chunk.text);
        }
      }

      try {
        const data = safeParseJSON(fullText);
        if (data) {
          if (data.newLocations && Array.isArray(data.newLocations)) {
            const currentLocs = worldDetails.locations || [];
            setWorldDetails({ ...worldDetails, locations: [...currentLocs, ...data.newLocations] });
            toast.success(`Đã tạo và thêm ${data.newLocations.length} Locations thành công!`);
          } else if (data.locations && Array.isArray(data.locations)) {
            const currentLocs = worldDetails.locations || [];
            setWorldDetails({ ...worldDetails, locations: [...currentLocs, ...data.locations] });
            toast.success(`Đã tạo và thêm ${data.locations.length} Locations thành công!`);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi phân tích cú pháp JSON cho Locations.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Gặp lỗi trong quá trình tạo Locations.");
    } finally {
      setIsGeneratingLocation(false);
      setIsGeneratingStream(false);
    }
  };

  const handleCreate = () => {
    if (!worldData.name.trim()) {
      toast.error("Vui lòng nhập tên thế giới!");
      return;
    }
    if (mcsData.length > 1 && selectedMcIndex === -1) {
      toast.error("Bạn đã tạo nhiều phiên bản MC. Vui lòng chọn 1 phiên bản MC trước khi bắt đầu!");
      setActiveTab("mc");
      return;
    }
    toast.success(`Đang khởi tạo thế giới "${worldData.name}"...`);
    // Clear old messages and set game data
    useStore.getState().setMessages([]);
    setGameData({
      initialIdea,
      developedIdea,
      worldData,
      mcData,
      originalMcData: JSON.parse(JSON.stringify(mcData)),
      npcs,
      originalNpcs: JSON.parse(JSON.stringify(npcs)),
      worldDetails,
    });
    setTimeout(() => {
      navigate("/gameplay");
    }, 1000);
  };

  const handleSaveData = () => {
    const dataToSave = {
      initialIdea,
      developedIdea,
      worldData,
      mcData,
      npcs,
      worldDetails,
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Tên game + tên thế giới + tên MC + ngày tháng năm
    const date = new Date();
    const dateStr = `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
    // Replace matching characters but keep Vietnamese characters if possible, or just replace spaces
    const safeWorldName = worldData.name
      ? worldData.name.replace(/\\s+/g, "_")
      : "TheGioi";
    const safeMcName = mcData.name ? mcData.name.replace(/\\s+/g, "_") : "MC";
    a.download = `Matrix_Lite_v4_${safeWorldName}_${safeMcName}_${dateStr}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSaveMenuOpen(false);
  };

  const handleLoadDataClick = () => {
    fileInputRef.current?.click();
    setIsSaveMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        updateWorldCreation(data);
        toast.success("Tải dữ liệu thế giới thành công!");
      } catch (err) {
        toast.error("Tệp không hợp lệ hoặc dữ liệu bị lỗi!");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input to allow loading the same file again if needed
  };

  const tabs = [
    { id: "world", label: "World", icon: Globe },
    { id: "mc", label: "MC", icon: User },
    { id: "npc", label: "NPCs", icon: Sword },
    { id: "items", label: "Location", icon: MapPin },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Sticky Header */}
      <div
        className={`sticky top-0 z-30 w-full backdrop-blur-3xl border-b border-white/5 py-4 px-4 md:px-6 lg:px-8 ${theme.bgClass}/80 shadow-lg shadow-black/5`}
      >
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Action Row */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="relative" ref={saveMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                className={`p-2.5 rounded-xl border transition-all shadow-md cursor-pointer flex items-center gap-1 ${
                  theme.group === "Dark"
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-black/10 bg-white/80 text-[#334155] hover:bg-black/5"
                }`}
                title="Dữ liệu"
              >
                <Save size={20} />
                <ChevronDownIcon
                  size={14}
                  className={`transition-transform ${isSaveMenuOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <AnimatePresence>
                {isSaveMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute top-full left-0 mt-2 w-48 rounded-xl border shadow-2xl overflow-hidden z-50 ${
                      theme.group === "Dark"
                        ? "border-white/10 bg-black/90 backdrop-blur-xl text-white"
                        : "border-black/10 bg-white/80 text-[#334155]"
                    }`}
                  >
                    <button
                      onClick={handleSaveData}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                        theme.group === "Dark"
                          ? "text-white/80 hover:text-white hover:bg-white/10"
                          : "text-[#334155] hover:text-[#0f172a] hover:bg-black/5"
                      }`}
                    >
                      <Download size={16} />
                      Lưu vào máy tính
                    </button>
                    <div
                      className={`h-[1px] w-full ${theme.group === "Dark" ? "bg-white/10" : "bg-black/10"}`}
                    />
                    <button
                      onClick={handleLoadDataClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                        theme.group === "Dark"
                          ? "text-white/80 hover:text-white hover:bg-white/10"
                          : "text-[#334155] hover:text-[#0f172a] hover:bg-black/5"
                      }`}
                    >
                      <Upload size={16} />
                      Tải lên từ máy
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFullScreenStream(true)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 px-3 ${
                theme.group === "Dark"
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white/80 text-[#334155] hover:bg-black/5"
              }`}
              title="Stream"
            >
              <Radio
                size={20}
                className={isGenerating ? "animate-pulse text-red-500" : ""}
              />
              <span className="text-sm font-bold hidden md:inline">Stream</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetWorldCreation();
              }}
              className={`p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all text-red-400 cursor-pointer flex items-center gap-2 px-3`}
              title="Reset"
            >
              <X size={20} />
              <span className="text-sm font-bold hidden md:inline">RESET</span>
            </motion.button>

            <div
              className={`flex rounded-xl border p-1 ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-sm"}`}
            >
              <button
                onClick={scrollToTop}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme.group === "Dark" ? "text-white/70 hover:text-white hover:bg-white/10" : "text-[#334155] hover:text-[#0f172a] hover:bg-black/5"}`}
                title="Lên trên"
              >
                <ChevronUp size={18} />
              </button>
              <button
                onClick={scrollToBottom}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme.group === "Dark" ? "text-white/70 hover:text-white hover:bg-white/10" : "text-[#334155] hover:text-[#0f172a] hover:bg-black/5"}`}
                title="Xuống dưới"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              className={`p-2.5 rounded-xl border border-blue-500/30 bg-blue-600 hover:bg-blue-500 transition-all text-white shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-2 px-4 md:px-6 shrink-0`}
              title="Start"
            >
              <Play size={20} className="fill-current" />
              <span className="text-sm font-black italic hidden md:inline tracking-widest">
                START
              </span>
            </motion.button>
          </div>

          {/* Navigation Tabs Row */}
          <div
            className={`flex p-1 rounded-xl border backdrop-blur-md overflow-x-auto no-scrollbar scrollbar-hide w-fit ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-xs"}`}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const label =
                tab.id === "npc" ? `NPCs (${npcs.length})` : tab.label;
              const isDark = theme.group === "Dark";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CreationTab)}
                  className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold flex items-center gap-2 transition-all relative cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? isDark
                        ? theme.textPrimary
                        : "text-white font-bold"
                      : isDark
                        ? "text-white/40 hover:text-white/70"
                        : "text-[#334155]/70 hover:text-[#0f172a]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-creation-tab"
                      className={`absolute inset-0 rounded-lg md:rounded-xl ${isDark ? "bg-white/20 border border-white/10 shadow-lg shadow-white/5" : "bg-slate-800 border border-amber-700 shadow-md shadow-amber-500/10"}`}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <tab.icon className="w-3 md:w-4 h-3 md:h-4 z-10" />
                  <span className="z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 md:px-8 lg:px-6 xl:px-8 pt-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="space-y-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  {activeTab === "world" && (
                    <div className="flex flex-col gap-10 items-stretch">
                      {/* Ideas Section */}
                      <div className="space-y-10">
                        <section className="space-y-6">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() =>
                                setIsInitialIdeaCollapsed(
                                  !isInitialIdeaCollapsed,
                                )
                              }
                              className={`text-sm font-bold uppercase tracking-widest ${theme.textSecondary} flex items-center gap-2 hover:text-white transition-colors cursor-pointer group`}
                            >
                              <BrainCircuit className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />{" "}
                              Ý tưởng sơ khai
                              {isInitialIdeaCollapsed ? (
                                <ChevronDown className="w-4 h-4 opacity-70" />
                              ) : (
                                <ChevronUp className="w-4 h-4 opacity-70" />
                              )}
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleAIGenerate}
                              disabled={isGenerating}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-600/30 transition-all cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>{formatTime(genTimer)}</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-4 h-4" />
                                  <span>AI Sáng tạo tất cả</span>
                                </>
                              )}
                              {isGenerating && (
                                <motion.div
                                  layoutId="gen-progress"
                                  className="absolute bottom-0 left-0 h-0.5 bg-purple-500 w-full"
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              )}
                            </motion.button>
                          </div>
                          <AnimatePresence>
                            {!isInitialIdeaCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden p-1 -m-1"
                              >
                                <CharacterTextArea
                                  label=""
                                  value={initialIdea}
                                  onChange={setInitialIdea}
                                  placeholder="Mô tả ngắn gọn về vũ trụ (ví dụ: Một hòn đảo bay nơi rồng và robot cùng tồn tại...)"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>

                        <section className="space-y-4">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() =>
                                setIsDevelopedIdeaCollapsed(
                                  !isDevelopedIdeaCollapsed,
                                )
                              }
                              className={`text-sm font-bold uppercase tracking-widest ${theme.textSecondary} flex items-center gap-2 hover:text-white transition-colors cursor-pointer group`}
                            >
                              <Sparkles className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />{" "}
                              Ý tưởng do AI phát triển
                              {isDevelopedIdeaCollapsed ? (
                                <ChevronDown className="w-4 h-4 opacity-70" />
                              ) : (
                                <ChevronUp className="w-4 h-4 opacity-70" />
                              )}
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleDevelopIdea}
                              disabled={isDevelopingIdea || !initialIdea.trim()}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isDevelopingIdea ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>{formatTime(devTimer)}</span>
                                </>
                              ) : (
                                <>
                                  <BrainCircuit className="w-4 h-4" />
                                  <span>AI phát triển ý tưởng</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                          <AnimatePresence>
                            {!isDevelopedIdeaCollapsed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden p-1 -m-1"
                              >
                                <CharacterTextArea
                                  label=""
                                  value={developedIdea}
                                  onChange={setDevelopedIdea}
                                  placeholder="Ý tưởng chi tiết sẽ xuất hiện ở đây sau khi AI xử lý..."
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>
                      </div>

                      {/* World Details Section */}
                      <div className="space-y-8">
                        <section className="space-y-4">
                          <CharacterTextArea
                            label="TÊN TRÒ CHƠI / TÊN CÂU CHUYỆN"
                            value={worldData.name}
                            onChange={(val) =>
                              setWorldData({ ...worldData, name: val })
                            }
                            placeholder="Nhập tên trò chơi..."
                            variant="title"
                            onAIGen={() =>
                              handleAIGenField(
                                "TÊN TRÒ CHƠI / TÊN CÂU CHUYỆN",
                                "name",
                              )
                            }
                            isGenerating={generatingFields["name"]}
                            description="Tên gọi chính thức của tác phẩm hoặc trò chơi. Định vị bản sắc và bao quát tinh thần cốt lõi của toàn bộ thế giới."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="ĐỘ KHÓ"
                            value={worldData.difficulty}
                            onChange={(val) =>
                              setWorldData({ ...worldData, difficulty: val })
                            }
                            placeholder="Độ khó thực tế. Yếu tố này sẽ trực tiếp chi phối tỉ lệ rủi ro, thành bại trong tính toán hành động của AI (VD: Hardcore có rủi ro cao)..."
                            onAIGen={() =>
                              handleAIGenField("ĐỘ KHÓ", "difficulty")
                            }
                            isGenerating={generatingFields["difficulty"]}
                            description="Quyết định mức độ khắc nghiệt của thế giới. Ảnh hưởng trực tiếp đến xác suất thành công của các hành động, mức độ nguy hiểm của kẻ thù và sự khan hiếm của tài nguyên (ví dụ: Dễ, Cực khó, Sinh tồn Hardcore)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="BỐI CẢNH"
                            value={worldData.background}
                            onChange={(val) =>
                              setWorldData({ ...worldData, background: val })
                            }
                            placeholder="Mô tả bối cảnh thế giới..."
                            onAIGen={() =>
                              handleAIGenField("BỐI CẢNH", "background")
                            }
                            isGenerating={generatingFields["background"]}
                            description="Mô tả tổng quan về không gian, thời gian và tình trạng hiện tại của thế giới (ví dụ: Hậu tận thế zombie, thế giới tu tiên, tương lai Cyberpunk đô thị)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="MỐC THỜI GIAN MỞ ĐẦU"
                            value={worldData.starterTimeline}
                            onChange={(val) =>
                              setWorldData({
                                ...worldData,
                                starterTimeline: val,
                              })
                            }
                            placeholder="Ví dụ: Năm 2045, Kỷ nguyên thứ 3..."
                            onAIGen={() =>
                              handleAIGenField(
                                "MỐC THỜI GIAN MỞ ĐẦU",
                                "starterTimeline",
                              )
                            }
                            isGenerating={generatingFields["starterTimeline"]}
                            description="Thời điểm cụ thể mà câu chuyện bắt đầu diễn ra (ví dụ: Năm 2026, Kỷ nguyên Ánh sáng thứ 3). BẮT BUỘC ĐẢM BẢO LOGIC TUYỆT ĐỐI VỚI NĂM SINH NHÂN VẬT."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="KỊCH BẢN MỞ ĐẦU"
                            value={worldData.starterScenario}
                            onChange={(val) =>
                              setWorldData({
                                ...worldData,
                                starterScenario: val,
                              })
                            }
                            placeholder="Diễn biến khởi đầu của câu chuyện..."
                            onAIGen={() =>
                              handleAIGenField(
                                "KỊCH BẢN MỞ ĐẦU",
                                "starterScenario",
                              )
                            }
                            isGenerating={generatingFields["starterScenario"]}
                            description="Tình huống, bối cảnh khởi đầu ngay khi nhân vật chính vừa xuất hiện hoặc bước vào thế giới. Giải thích họ đang ở đâu, đang làm gì và chuyện gì vừa xảy ra."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="QUY TẮC THẾ GIỚI (LUẬT LỆ, CẤM KỴ, QUY LUẬT VẬN HÀNH)"
                            value={worldData.worldRules}
                            onChange={(val) =>
                              setWorldData({ ...worldData, worldRules: val })
                            }
                            placeholder="Những luật lệ và quy luật của thế giới này..."
                            onAIGen={() =>
                              handleAIGenField("QUY TẮC THẾ GIỚI", "worldRules")
                            }
                            isGenerating={generatingFields["worldRules"]}
                            description="Các định luật vật lý, quy tắc ma thuật, thiên đạo hoặc quy tắc sinh tồn đặc thù của riêng thế giới này mà mọi thực thể bên trong đều phải tuân theo tuyệt đối."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)"
                            value={worldData.namingConventions || ""}
                            onChange={(val) =>
                              setWorldData({
                                ...worldData,
                                namingConventions: val,
                              })
                            }
                            placeholder="Quy tắc đặt và chọn tên cho mọi thực thể trong thế giới (Ví dụ: tên nhân vật theo kiểu Nhật, địa danh theo thần thoại Bắc Âu, vũ khí có gốc tiếng Latin)..."
                            onAIGen={() =>
                              handleAIGenField(
                                "QUY TẮC ĐẶT TÊN",
                                "namingConventions",
                              )
                            }
                            isGenerating={generatingFields["namingConventions"]}
                            description="Cách thức hoặc phong cách đặt tên đặc trưng áp dụng cho các nhân vật, địa danh, vật phẩm (ví dụ: Tên mang âm hưởng thần thoại Bắc Âu, cách gọi tên theo biệt danh kiểu Cyberpunk)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterInput
                            label="THỂ LOẠI (GENRE)"
                            value={worldData.genre}
                            onChange={(val) =>
                              setWorldData({ ...worldData, genre: val })
                            }
                            placeholder="Thể loại thế giới..."
                            onAIGen={() =>
                              handleAIGenField("THỂ LOẠI", "genre")
                            }
                            isGenerating={generatingFields["genre"]}
                            description="Thể loại chính định hình tác phẩm (ví dụ: Hành động sinh tồn, Tình cảm lãng mạn, Kinh dị tâm lý, Huyền huyễn tu chân)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterInput
                            label="ÂM HƯỞNG CHỦ ĐẠO (MAIN MOOD & AESTHETIC)"
                            value={worldData.mainMood}
                            onChange={(val) =>
                              setWorldData({ ...worldData, mainMood: val })
                            }
                            placeholder="Âm hưởng, màu sắc chủ đạo..."
                            onAIGen={() =>
                              handleAIGenField("ÂM HƯỞNG CHỦ ĐẠO", "mainMood")
                            }
                            isGenerating={generatingFields["mainMood"]}
                            description="Không khí, màu sắc và cảm xúc xuyên suốt tác phẩm mà AI cần giữ vững (ví dụ: U ám và tuyệt vọng, Hài hước tươi sáng, Bi tráng và hào hùng)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterInput
                            label="NHỊP ĐỘ (PACING)"
                            value={worldData.pacing}
                            onChange={(val) =>
                              setWorldData({ ...worldData, pacing: val })
                            }
                            placeholder="Nhịp độ diễn biến..."
                            onAIGen={() =>
                              handleAIGenField("NHỊP ĐỘ", "pacing")
                            }
                            isGenerating={generatingFields["pacing"]}
                            description="Tốc độ diễn biến cốt truyện và nhịp điệu của các sự kiện (ví dụ: Chậm rãi thiên về miêu tả nội tâm/đời thường, Dồn dập với các pha hành động liên tục)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="ĐỊA LÝ & VÙNG LÃNH THỔ"
                            value={worldData.geography}
                            onChange={(val) =>
                              setWorldData({ ...worldData, geography: val })
                            }
                            placeholder="Địa lý, vùng lãnh thổ..."
                            onAIGen={() =>
                              handleAIGenField(
                                "ĐỊA LÝ & VÙNG LÃNH THỔ",
                                "geography",
                              )
                            }
                            isGenerating={generatingFields["geography"]}
                            description="Mô tả tổng quan về các khu vực, dạng địa hình, môi trường tự nhiên, lục địa và sự phân bố lãnh thổ trong thế giới."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="LỊCH SỬ THẾ GIỚI"
                            value={worldData.worldHistory}
                            onChange={(val) =>
                              setWorldData({ ...worldData, worldHistory: val })
                            }
                            placeholder="Lịch sử thế giới..."
                            onAIGen={() =>
                              handleAIGenField(
                                "LỊCH SỬ THẾ GIỚI",
                                "worldHistory",
                              )
                            }
                            isGenerating={generatingFields["worldHistory"]}
                            description="Các sự kiện vĩ mô, những cuộc chiến, kỷ nguyên đã trôi qua trong quá khứ để tạo ra thế cục của thế giới như hiện tại."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="VĂN HÓA & PHONG TỤC"
                            value={worldData.culture}
                            onChange={(val) =>
                              setWorldData({ ...worldData, culture: val })
                            }
                            placeholder="Văn hóa, ngôn ngữ, tập tục..."
                            onAIGen={() =>
                              handleAIGenField("VĂN HÓA & PHONG TỤC", "culture")
                            }
                            isGenerating={generatingFields["culture"]}
                            description="Tập quán sinh hoạt, tín ngưỡng dân gian, ngôn ngữ giao tiếp, nghệ thuật, lễ hội và lối sống đặc trưng của cư dân bản địa."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="KINH TẾ & XÃ HỘI"
                            value={worldData.economy}
                            onChange={(val) =>
                              setWorldData({ ...worldData, economy: val })
                            }
                            placeholder="Cấu trúc kinh tế, phân hóa xã hội..."
                            onAIGen={() =>
                              handleAIGenField("KINH TẾ & XÃ HỘI", "economy")
                            }
                            isGenerating={generatingFields["economy"]}
                            description="Hệ thống tiền tệ/trao đổi, phương thức sản xuất, cấu trúc giai tầng xã hội, sự phân hóa giàu nghèo và quyền lực."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="TÔN GIÁO & TÍN NGƯỠNG"
                            value={worldData.religion}
                            onChange={(val) =>
                              setWorldData({ ...worldData, religion: val })
                            }
                            placeholder="Tôn giáo chính, nghi lễ..."
                            onAIGen={() =>
                              handleAIGenField(
                                "TÔN GIÁO & TÍN NGƯỠNG",
                                "religion",
                              )
                            }
                            isGenerating={generatingFields["religion"]}
                            description="Các thế lực tâm linh, vị thần được tôn thờ, các giáo phái lớn, hệ thống tín điều, nghi lễ và đức tin của người dân."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="CÁC QUỐC GIA & THẾ LỰC"
                            value={worldData.factions}
                            onChange={(val) =>
                              setWorldData({ ...worldData, factions: val })
                            }
                            placeholder="Quốc gia, tổ chức, giáo phái..."
                            onAIGen={() =>
                              handleAIGenField(
                                "CÁC QUỐC GIA & THẾ LỰC",
                                "factions",
                              )
                            }
                            isGenerating={generatingFields["factions"]}
                            description="Tên và đặc điểm của các quốc gia, vương quốc, tập đoàn, tổ chức ngầm, bang phái hoặc giáo phái lớn có tầm ảnh hưởng."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="MỐI QUAN HỆ GIỮA CÁC THẾ LỰC"
                            value={worldData.factionRelations}
                            onChange={(val) =>
                              setWorldData({
                                ...worldData,
                                factionRelations: val,
                              })
                            }
                            placeholder="Xung đột, liên minh, trung lập..."
                            onAIGen={() =>
                              handleAIGenField(
                                "MỐI QUAN HỆ GIỮA CÁC THẾ LỰC",
                                "factionRelations",
                              )
                            }
                            isGenerating={generatingFields["factionRelations"]}
                            description="Tình trạng ngoại giao, cán cân quyền lực, những liên minh bền chặt, xung đột lợi ích, chiến tranh hay thù địch giữa các phe phái."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="CÁC YẾU TỐ ĐỘC ĐÁO"
                            value={worldData.uniqueElements}
                            onChange={(val) =>
                              setWorldData({
                                ...worldData,
                                uniqueElements: val,
                              })
                            }
                            placeholder="Sinh vật đặc hữu, công nghệ cốt lõi..."
                            onAIGen={() =>
                              handleAIGenField(
                                "CÁC YẾU TỐ ĐỘC ĐÁO",
                                "uniqueElements",
                              )
                            }
                            isGenerating={generatingFields["uniqueElements"]}
                            description="Những sinh vật đặc thù, dị năng, hệ thống công nghệ cốt lõi hoặc hiện tượng kỳ lạ chỉ tồn tại duy nhất ở thế giới này."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="HỆ THỐNG SỨC MẠNH / LOGIC / ĐIỂM PHÂN BẬC"
                            value={worldData.powerSystem}
                            onChange={(val) =>
                              setWorldData({ ...worldData, powerSystem: val })
                            }
                            placeholder="Bắt buộc chi tiết hóa bậc năng lực, rank, cảnh giới, hoặc các thước đo quyền lực..."
                            onAIGen={() =>
                              handleAIGenField(
                                "HỆ THỐNG SỨC MẠNH",
                                "powerSystem",
                              )
                            }
                            isGenerating={generatingFields["powerSystem"]}
                            description="Cơ chế phân cấp sức mạnh rõ ràng, các bậc tu luyện, cấp độ ma thuật, cảnh giới, hoặc hệ thống rank đánh giá thực lực từ thấp đến cao."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="KIỂM SOÁT LOGIC & CÁC YẾU TỐ LOẠI TRỪ"
                            value={worldData.logicControl}
                            onChange={(val) =>
                              setWorldData({ ...worldData, logicControl: val })
                            }
                            placeholder="Những thứ không được phép tồn tại trong thế giới này..."
                            onAIGen={() =>
                              handleAIGenField(
                                "KIỂM SOÁT LOGIC",
                                "logicControl",
                              )
                            }
                            isGenerating={generatingFields["logicControl"]}
                            description="Những giới hạn và quy định chặt chẽ về những công nghệ, khái niệm hoặc sức mạnh TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP XẢY RA hoặc KHÔNG TỒN TẠI để đảm bảo tính logic."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterTextArea
                            label="VĂN PHONG"
                            value={worldData.writingStyle}
                            onChange={(val) =>
                              setWorldData({ ...worldData, writingStyle: val })
                            }
                            placeholder="Văn phong miêu tả trần thuật, cách dùng từ ngữ (thuần Việt, Hán Việt phổ thông, hay Hán Việt cổ trang)..."
                            onAIGen={() =>
                              handleAIGenField("VĂN PHONG", "writingStyle")
                            }
                            isGenerating={generatingFields["writingStyle"]}
                            description="Quy định giọng điệu miêu tả của AI. Cần xác định rõ bối cảnh để kiểm soát từ Hán Việt đặc thù (ví dụ: bối cảnh Phương Đông dùng nhiều từ Hán Việt cổ trang; bối cảnh Phương Tây/Hiện đại dùng từ thuần Việt và Hán Việt phổ quát, CẤM từ cổ trang/kiếm hiệp)."
                          />
                        </section>

                        <section className="space-y-4">
                          <CharacterInput
                            label="NGÔI KỂ"
                            value={worldData.narrativePerspective}
                            onChange={(val) =>
                              setWorldData({
                                ...worldData,
                                narrativePerspective: val,
                              })
                            }
                            placeholder="Ngôi thứ ba, ngôi thứ nhất..."
                            onAIGen={() =>
                              handleAIGenField(
                                "NGÔI KỂ",
                                "narrativePerspective",
                              )
                            }
                            isGenerating={
                              generatingFields["narrativePerspective"]
                            }
                            description="Góc nhìn kể chuyện xuyên suốt (ví dụ: Ngôi thứ nhất - xưng 'Tôi', Ngôi thứ ba - gọi thẳng tên nhân vật) và sự tập trung của điểm nhìn."
                          />
                        </section>
                      </div>
                    </div>
                  )}

                  {activeTab === "mc" && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                      {/* Form Ý tưởng tạo MC */}
                      <div className="space-y-4 mb-8">
                        <h3 className={`text-lg font-bold ${theme.textPrimary} flex items-center gap-2`}>
                          <Sparkles className="w-5 h-5" /> Ý TƯỞNG DÀNH RIÊNG CHO MC
                        </h3>
                        <CharacterTextArea
                          label=""
                          value={mcIdea}
                          onChange={setMcIdea}
                          placeholder="Mô tả ý tưởng về nhân vật chính (ví dụ: Một kiếm khách lạnh lùng, thiên tài bị phế tu vi...)"
                        />
                        <div className="flex justify-end">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateMC}
                            disabled={isGeneratingMc}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-600/30 transition-all cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                          >
                            {isGeneratingMc ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang tạo MC...</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                <span>Tạo MC</span>
                              </>
                            )}
                            {isGeneratingMc && (
                              <motion.div
                                layoutId="gen-progress-mc"
                                className="absolute bottom-0 left-0 h-0.5 bg-purple-500 w-full"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {mcsData.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-8 bg-black/20 p-4 rounded-2xl border border-white/5 items-center">
                          <span className={`text-sm font-bold ${theme.textPrimary} mr-2 flex items-center`}>Chọn phiên bản MC:</span>
                          {mcsData.map((mc, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  // Save current mcData back to mcsData before switching
                                  const newMcsData = [...mcsData];
                                  if (selectedMcIndex !== -1) {
                                    newMcsData[selectedMcIndex] = mcData;
                                  }
                                  setMcsData(newMcsData);
                                  
                                  // Switch to new MC
                                  setSelectedMcIndex(idx);
                                  setMcData(newMcsData[idx]);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                  selectedMcIndex === idx
                                    ? "bg-blue-600/30 text-blue-400 border border-blue-500/50"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent"
                                }`}
                              >
                                {mc.name || `Phiên bản ${idx + 1}`}
                              </button>
                          ))}
                        </div>
                      )}

                      {selectedMcIndex === -1 ? (
                        <div className="flex items-center justify-center py-20 text-slate-400 text-lg font-medium border border-dashed border-white/10 rounded-2xl">
                          Vui lòng chọn 1 phiên bản MC ở trên để xem và chỉnh sửa chi tiết.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Nhóm 1: Thông tin định danh */}
                        <div className="space-y-6 col-span-full">
                          <h3
                            className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}
                          >
                            <User className="w-5 h-5" /> THÔNG TIN ĐỊNH DANH
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CharacterInput
                              label="TÊN GỌI"
                              value={mcData.name}
                              onChange={(val) =>
                                setMcData({ ...mcData, name: val })
                              }
                            />
                            <CharacterInput
                              label="HỌ VÀ TÊN"
                              value={mcData.fullName}
                              onChange={(val) =>
                                setMcData({ ...mcData, fullName: val })
                              }
                            />
                            <CharacterInput
                              label="DANH XƯNG (TƯỚC HIỆU)"
                              value={mcData.titles}
                              onChange={(val) =>
                                setMcData({ ...mcData, titles: val })
                              }
                            />
                            <CharacterInput
                              label="CHỨC VỤ (NGHỀ NGHIỆP)"
                              value={mcData.occupation}
                              onChange={(val) =>
                                setMcData({ ...mcData, occupation: val })
                              }
                            />
                            <CharacterInput
                              label="GIỚI TÍNH"
                              value={mcData.gender}
                              onChange={(val) =>
                                setMcData({ ...mcData, gender: val })
                              }
                            />
                            <CharacterInput
                              label="TUỔI TÁC"
                              value={mcData.age}
                              onChange={(val) =>
                                setMcData({ ...mcData, age: val })
                              }
                            />
                            <CharacterInput
                              label="NGÀY THÁNG NĂM SINH"
                              value={mcData.dob}
                              onChange={(val) =>
                                setMcData({ ...mcData, dob: val })
                              }
                            />
                            <CharacterInput
                              label="CẢNH GIỚI / CẤP ĐỘ"
                              value={mcData.rank}
                              onChange={(val) =>
                                setMcData({ ...mcData, rank: val })
                              }
                            />
                          </div>
                        </div>

                        {/* Nhóm 2: Đặc trưng hình thể */}
                        <div className="space-y-6 col-span-full">
                          <h3
                            className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}
                          >
                            <Sparkles className="w-5 h-5" /> ĐẶC TRƯNG HÌNH THỂ
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CharacterInput
                              label="CHIỀU CAO"
                              value={mcData.height}
                              onChange={(val) =>
                                setMcData({ ...mcData, height: val })
                              }
                            />
                            <CharacterInput
                              label="CÂN NẶNG"
                              value={mcData.weight}
                              onChange={(val) =>
                                setMcData({ ...mcData, weight: val })
                              }
                            />
                            <CharacterInput
                              label="SỐ ĐO 3 VÒNG"
                              value={mcData.measurements}
                              onChange={(val) =>
                                setMcData({ ...mcData, measurements: val })
                              }
                            />
                          </div>
                          <CharacterTextArea
                            label="MIÊU TẢ NGOẠI HÌNH TỔNG QUAN"
                            value={mcData.appearance}
                            onChange={(val) =>
                              setMcData({ ...mcData, appearance: val })
                            }
                          />
                          <CharacterTextArea
                            label="ĐẶC ĐIỂM NHẬN DẠNG PHỤ"
                            value={mcData.distinguishingFeatures}
                            onChange={(val) =>
                              setMcData({
                                ...mcData,
                                distinguishingFeatures: val,
                              })
                            }
                          />
                        </div>

                        {/* Nhóm 3: Năng lực & Bản ngã */}
                        <div className="space-y-6 col-span-full">
                          <h3
                            className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}
                          >
                            <BrainCircuit className="w-5 h-5" /> NĂNG LỰC & BẢN
                            NGÃ
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            <ArrayItemEditor
                              itemLabel="Năng Lực"
                              label="NĂNG LỰC / SỨC MẠNH"
                              items={mcData.powers}
                              onChange={(val) =>
                                setMcData({ ...mcData, powers: val })
                              }
                            />
                            <ArrayItemEditor
                              itemLabel="Kỹ Năng"
                              label="KỸ NĂNG CHUYÊN MÔN"
                              items={mcData.skills}
                              onChange={(val) =>
                                setMcData({ ...mcData, skills: val })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CharacterTextArea
                              label="TÍNH CÁCH TỔNG QUAN"
                              value={mcData.personality}
                              onChange={(val) =>
                                setMcData({ ...mcData, personality: val })
                              }
                            />
                            <CharacterTextArea
                              label="TÍNH CÁCH CỐT LÕI (BẢN NGÃ)"
                              value={mcData.personalityCore}
                              onChange={(val) =>
                                setMcData({ ...mcData, personalityCore: val })
                              }
                            />
                            <CharacterTextArea
                              label="KIM CHỈ NAM / LÝ TƯỞNG"
                              value={mcData.philosophy}
                              onChange={(val) =>
                                setMcData({ ...mcData, philosophy: val })
                              }
                            />
                            <CharacterTextArea
                              label="MỤC TIÊU TỐI THƯỢNG"
                              value={mcData.goal}
                              onChange={(val) =>
                                setMcData({ ...mcData, goal: val })
                              }
                            />
                          </div>
                        </div>

                        {/* Nhóm 4: Hoàn cảnh & Nội tâm */}
                        <div className="space-y-6 col-span-full">
                          <h3
                            className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}
                          >
                            <Shield className="w-5 h-5" /> HOÀN CẢNH & NỘI TÂM
                          </h3>
                          <CharacterTextArea
                            label="NGUỒN GỐC / XUẤT THÂN / HOÀN CẢNH"
                            value={mcData.background}
                            onChange={(val) =>
                              setMcData({ ...mcData, background: val })
                            }
                          />
                          <CharacterTextArea
                            label="NỘI TÂM / SUY NGHĨ THẦM KÍN / ĐỘNG CƠ ẨN"
                            value={mcData.innerSecret}
                            onChange={(val) =>
                              setMcData({ ...mcData, innerSecret: val })
                            }
                          />
                        </div>

                        {/* Nhóm 5: Nội dung người lớn (NSFW) */}
                        <div className="space-y-6 col-span-full">
                          <h3 className="text-lg font-bold text-rose-400 border-l-4 border-current pl-4 flex items-center gap-2">
                            <Zap className="w-5 h-5" /> CHI TIẾT ĐẶC TRƯNG &
                            NSFW
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CharacterTextArea
                              label="QUAN NIỆM VỀ TÌNH YÊU & TÌNH DỤC"
                              value={mcData.loveViews}
                              onChange={(val) =>
                                setMcData({ ...mcData, loveViews: val })
                              }
                            />
                            <CharacterTextArea
                              label="TRINH TIẾT VÀ KINH NGHIỆM NSFW"
                              value={mcData.experience}
                              onChange={(val) =>
                                setMcData({ ...mcData, experience: val })
                              }
                            />
                            <CharacterTextArea
                              label="TÍNH CÁCH KHI NSFW"
                              value={mcData.nsfwPersonality}
                              onChange={(val) =>
                                setMcData({ ...mcData, nsfwPersonality: val })
                              }
                            />
                            <CharacterTextArea
                              label="PHẢN ỨNG ĐẶC TRƯNG (NSFW)"
                              value={mcData.nsfwReactions}
                              onChange={(val) =>
                                setMcData({ ...mcData, nsfwReactions: val })
                              }
                            />
                          </div>
                        </div>

                        {/* Nhóm 6: Miêu tả văn học */}
                        <div className="space-y-6 col-span-full">
                          <h3
                            className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}
                          >
                            <Terminal className="w-5 h-5" /> VĂN BẢN MIÊU TẢ
                            HOÀN CHỈNH
                          </h3>
                          <CharacterTextArea
                            label="MIÊU TẢ BẰNG NGÔN TỪ VĂN HỌC"
                            value={mcData.literaryDescription}
                            onChange={(val) =>
                              setMcData({ ...mcData, literaryDescription: val })
                            }
                            rows={10}
                          />
                        </div>

                        {/* Nhóm 7: Túi Đồ (Inventory) */}
                        <div className="space-y-6 col-span-full">
                          <h3
                            className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5" /> TÚI ĐỒ (INVENTORY)
                            </div>
                            <button
                              onClick={() => {
                                const newInv = [
                                  ...(Array.isArray(mcData.inventory)
                                    ? mcData.inventory
                                    : []),
                                ];
                                newInv.push({
                                  name: "",
                                  quantity: 1,
                                  description: "",
                                });
                                setMcData({ ...mcData, inventory: newInv });
                              }}
                              className={`text-sm flex items-center gap-1 font-normal p-1 px-3 rounded-lg border cursor-pointer transition-colors ${theme.group === "Dark" ? "border-white/10 hover:bg-white/10 text-white/80 hover:text-white" : "border-black/10 hover:bg-black/5 text-[#334155]"}`}
                            >
                              <Plus className="w-4 h-4" /> Thêm vật phẩm
                            </button>
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {Array.isArray(mcData.inventory) &&
                              mcData.inventory.map((item, i) => (
                                <div
                                  key={i}
                                  className={`p-4 rounded-xl border flex gap-4 ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-sm"}`}
                                >
                                  <div className="flex-1 space-y-3">
                                    <div className="flex gap-4">
                                      <div className="flex-[2]">
                                        <CharacterInput
                                          label="Tên vật phẩm"
                                          value={item.name}
                                          onChange={(val) => {
                                            const newInv = [
                                              ...mcData.inventory,
                                            ];
                                            newInv[i] = {
                                              ...newInv[i],
                                              name: val,
                                            };
                                            setMcData({
                                              ...mcData,
                                              inventory: newInv,
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <CharacterInput
                                          label="Số lượng"
                                          value={String(item.quantity)}
                                          onChange={(val) => {
                                            const newInv = [
                                              ...mcData.inventory,
                                            ];
                                            newInv[i] = {
                                              ...newInv[i],
                                              quantity: Number(val) || 1,
                                            };
                                            setMcData({
                                              ...mcData,
                                              inventory: newInv,
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <CharacterTextArea
                                      label="Mô tả công năng / Đặc điểm"
                                      value={item.description}
                                      onChange={(val) => {
                                        const newInv = [...mcData.inventory];
                                        newInv[i] = {
                                          ...newInv[i],
                                          description: val,
                                        };
                                        setMcData({
                                          ...mcData,
                                          inventory: newInv,
                                        });
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newInv = mcData.inventory.filter(
                                        (_, idx) => idx !== i,
                                      );
                                      setMcData({
                                        ...mcData,
                                        inventory: newInv,
                                      });
                                    }}
                                    className="p-2 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer mt-4"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            {(!Array.isArray(mcData.inventory) ||
                              mcData.inventory.length === 0) && (
                              <div
                                className={`p-6 text-center rounded-xl border border-dashed ${theme.group === "Dark" ? "border-white/20 text-white/40" : "border-black/10 text-[#334155]/60"}`}
                              >
                                Hiện tại túi đồ đang trống.
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {mcsData.length > 0 && (
                          <div className="col-span-full mt-8 flex justify-end">
                            <button
                              onClick={() => {
                                const newMcsData = [...mcsData];
                                newMcsData.splice(selectedMcIndex, 1);
                                setMcsData(newMcsData);
                                setSelectedMcIndex(-1);
                                toast.info("Đã xóa MC đang chọn.");
                              }}
                              className="px-6 py-3 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:text-red-300 font-bold transition-all cursor-pointer flex items-center gap-2"
                            >
                              <Trash2 className="w-5 h-5" />
                              Xóa MC đang chọn
                            </button>
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  )}

                  {activeTab === "npc" && (
                    <div className="space-y-12">
                      {/* Form Ý tưởng tạo NPCs */}
                      <div className="space-y-4 mb-8">
                        <h3 className={`text-lg font-bold ${theme.textPrimary} flex items-center gap-2`}>
                          <Sparkles className="w-5 h-5" /> Ý TƯỞNG DÀNH RIÊNG CHO NPCs
                        </h3>
                        <CharacterTextArea
                          label=""
                          value={npcIdea}
                          onChange={setNpcIdea}
                          placeholder="Mô tả ý tưởng về các NPC (ví dụ: Cần 1 cô công chúa kiêu ngạo, 1 ông lão bí ẩn, 1 tên sát thủ máu lạnh...)"
                        />
                        <div className="flex justify-end">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateNPCs}
                            disabled={isGeneratingNpc}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-600/30 transition-all cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                          >
                            {isGeneratingNpc ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang tạo NPCs...</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                <span>Tạo NPCs</span>
                              </>
                            )}
                            {isGeneratingNpc && (
                              <motion.div
                                layoutId="gen-progress-npc"
                                className="absolute bottom-0 left-0 h-0.5 bg-purple-500 w-full"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {npcs.map((npc, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-8 rounded-[3rem] bg-white/5 border border-white/10 relative group shadow-2xl"
                        >
                          <button
                            onClick={() =>
                              setNpcs(npcs.filter((_, i) => i !== idx))
                            }
                            className="absolute top-6 right-6 p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer z-10"
                            title="Xóa NPC"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>

                          <div className="space-y-10">
                            {/* Định danh nhanh */}
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                  <label
                                    className={`text-xs font-black uppercase tracking-[0.2em] ${theme.textSecondary}`}
                                  >
                                    Tên hiển thị & Vai trò
                                  </label>
                                  <button
                                    onClick={() => toggleNpc(idx)}
                                    className={`${theme.textSecondary} hover:text-white transition-colors cursor-pointer mr-12`}
                                  >
                                    {collapsedNpcs[idx] ? (
                                      <ChevronDown className="w-5 h-5" />
                                    ) : (
                                      <ChevronUp className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <CharacterTextArea
                                    label=""
                                    placeholder="Tên gọi nhanh (Ví dụ: Elena)"
                                    value={npc.name}
                                    onChange={(val) => {
                                      const newNpcs = [...npcs];
                                      newNpcs[idx] = {
                                        ...newNpcs[idx],
                                        name: val,
                                      };
                                      setNpcs(newNpcs);
                                    }}
                                    variant="npc-header"
                                  />
                                  <CharacterTextArea
                                    label=""
                                    placeholder="Vai trò (Người hướng dẫn, Đối thủ...)"
                                    value={npc.role}
                                    onChange={(val) => {
                                      const newNpcs = [...npcs];
                                      newNpcs[idx] = {
                                        ...newNpcs[idx],
                                        role: val,
                                      };
                                      setNpcs(newNpcs);
                                    }}
                                    variant="npc-header"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Chi tiết mở rộng */}
                            <AnimatePresence initial={false}>
                              {!collapsedNpcs[idx] && (
                                <motion.div
                                  className="grid grid-cols-1 gap-8 overflow-hidden"
                                  initial={{
                                    height: 0,
                                    opacity: 0,
                                    marginTop: 0,
                                  }}
                                  animate={{
                                    height: "auto",
                                    opacity: 1,
                                    marginTop: "2rem",
                                  }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                >
                                  {/* Nhóm 1: Định danh chi tiết */}
                                  <div className="space-y-4">
                                    <h4
                                      className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}
                                    >
                                      <User className="w-4 h-4" /> CHI TIẾT ĐỊNH
                                      DANH
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <CharacterInput
                                        label="HỌ VÀ TÊN"
                                        value={npc.fullName}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], fullName: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="DANH XƯNG (TƯỚC HIỆU)"
                                        value={npc.titles}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], titles: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="CHỨC VỤ (NGHỀ NGHIỆP)"
                                        value={npc.occupation}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            occupation: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="GIỚI TÍNH"
                                        value={npc.gender}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], gender: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="TUỔI TÁC"
                                        value={npc.age}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], age: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="NGÀY THÁNG NĂM SINH"
                                        value={npc.dob}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], dob: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="CẢNH GIỚI / CẤP ĐỘ"
                                        value={npc.rank}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], rank: val };
                                          setNpcs(n);
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Nhóm 2: Hình thể */}
                                  <div className="space-y-4">
                                    <h4
                                      className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}
                                    >
                                      <Sparkles className="w-4 h-4" /> ĐẶC TRƯNG
                                      HÌNH THỂ
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <CharacterInput
                                        label="CHIỀU CAO"
                                        value={npc.height}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], height: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="CÂN NẶNG"
                                        value={npc.weight}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], weight: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterInput
                                        label="SỐ ĐO 3 VÒNG"
                                        value={npc.measurements}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            measurements: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                    </div>
                                    <CharacterTextArea
                                      label="MIÊU TẢ NGOẠI HÌNH TỔNG QUAN"
                                      value={npc.appearance}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = { ...n[idx], appearance: val };
                                        setNpcs(n);
                                      }}
                                    />
                                    <CharacterTextArea
                                      label="MIÊU TẢ LITE (TÓM TẮT NGOẠI HÌNH)"
                                      value={npc.appearanceLite || ""}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = {
                                          ...n[idx],
                                          appearanceLite: val,
                                        };
                                        setNpcs(n);
                                      }}
                                      placeholder="Tóm tắt ngắn gọn ngoại hình của NPC để AI dễ ghi nhớ..."
                                      rows={3}
                                    />
                                    <CharacterTextArea
                                      label="ĐẶC ĐIỂM NHẬN DẠNG PHỤ"
                                      value={npc.distinguishingFeatures}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = {
                                          ...n[idx],
                                          distinguishingFeatures: val,
                                        };
                                        setNpcs(n);
                                      }}
                                    />
                                  </div>

                                  {/* Nhóm 3: Năng lực & Tính cách */}
                                  <div className="space-y-4">
                                    <h4
                                      className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}
                                    >
                                      <BrainCircuit className="w-4 h-4" /> NĂNG
                                      LỰC & TÍNH CÁCH
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4 mb-4">
                                      <ArrayItemEditor
                                        itemLabel="Năng Lực"
                                        label="NĂNG LỰC / SỨC MẠNH"
                                        items={npc.powers}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], powers: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <ArrayItemEditor
                                        itemLabel="Kỹ Năng"
                                        label="KỸ NĂNG CHUYÊN MÔN"
                                        items={npc.skills}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], skills: val };
                                          setNpcs(n);
                                        }}
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <CharacterTextArea
                                        label="TÍNH CÁCH TỔNG QUAN"
                                        value={npc.personality}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            personality: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="TÍNH CÁCH CỐT LÕI (BẢN NGÃ)"
                                        value={npc.personalityCore}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            personalityCore: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="KIM CHỈ NAM / LÝ TƯỞNG"
                                        value={npc.philosophy}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            philosophy: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="MỤC TIÊU TỐI THƯỢNG"
                                        value={npc.goal}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], goal: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="NHU CẦU (SFW & NSFW)"
                                        value={npc.needs || ""}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = { ...n[idx], needs: val };
                                          setNpcs(n);
                                        }}
                                      />
                                      <div className="space-y-4 col-span-1 md:col-span-2">
                                        <div className="flex flex-col gap-4">
                                          <CharacterTextArea
                                            label="SỞ THÍCH, GHÉT, NỖI SỢ (SFW)"
                                            value={npc.preferences?.sfw || ""}
                                            onChange={(val) => {
                                              const n = [...npcs];
                                              n[idx] = {
                                                ...n[idx],
                                                preferences: {
                                                  ...n[idx].preferences,
                                                  sfw: val,
                                                  nsfw:
                                                    n[idx].preferences?.nsfw ||
                                                    "",
                                                },
                                              };
                                              setNpcs(n);
                                            }}
                                            placeholder="Ví dụ: Thích hoa, ghét cá, sợ bóng tối..."
                                          />
                                          <CharacterTextArea
                                            label="SỞ THÍCH, GHÉT, NỖI SỢ (NSFW) [TÙY CHỌN]"
                                            value={npc.preferences?.nsfw || ""}
                                            onChange={(val) => {
                                              const n = [...npcs];
                                              n[idx] = {
                                                ...n[idx],
                                                preferences: {
                                                  ...n[idx].preferences,
                                                  sfw:
                                                    n[idx].preferences?.sfw ||
                                                    "",
                                                  nsfw: val,
                                                },
                                              };
                                              setNpcs(n);
                                            }}
                                            placeholder="Ví dụ: Thích bị cắn, ghét bạo lực quá mức, sợ..."
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Nhóm 4: Hoàn cảnh & Nội tâm */}
                                  <div className="space-y-4">
                                    <h4
                                      className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}
                                    >
                                      <Shield className="w-4 h-4" /> HOÀN CẢNH &
                                      NỘI TÂM
                                    </h4>
                                    <CharacterTextArea
                                      label="NGUỒN GỐC / XUẤT THÂN / HOÀN CẢNH"
                                      value={npc.background}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = { ...n[idx], background: val };
                                        setNpcs(n);
                                      }}
                                    />
                                    <CharacterTextArea
                                      label="NỘI TÂM / SUY NGHĨ THẦM KÍN / ĐỘNG CƠ ẨN"
                                      value={npc.innerSecret}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = {
                                          ...n[idx],
                                          innerSecret: val,
                                        };
                                        setNpcs(n);
                                      }}
                                    />
                                    <RelationshipArrayEditor
                                      label="TỔNG QUAN CÁC QUAN HỆ"
                                      items={npc.relationships}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = {
                                          ...n[idx],
                                          relationships: val,
                                        };
                                        setNpcs(n);
                                      }}
                                    />
                                  </div>

                                  {/* Nhóm 5: Quan hệ & NSFW */}
                                  <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2 opacity-70">
                                      <Zap className="w-4 h-4" /> NSFW
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <CharacterTextArea
                                        label="QUAN NIỆM VỀ TÌNH YÊU & TÌNH DỤC"
                                        value={npc.loveViews}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            loveViews: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="TRINH TIẾT VÀ KINH NGHIỆM NSFW"
                                        value={npc.experience}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            experience: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="TÍNH CÁCH KHI NSFW"
                                        value={npc.nsfwPersonality}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            nsfwPersonality: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                      <CharacterTextArea
                                        label="PHẢN ỨNG ĐẶC TRƯNG (NSFW)"
                                        value={npc.nsfwReactions}
                                        onChange={(val) => {
                                          const n = [...npcs];
                                          n[idx] = {
                                            ...n[idx],
                                            nsfwReactions: val,
                                          };
                                          setNpcs(n);
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Nhóm 5: Tác phẩm */}
                                  <div className="space-y-4">
                                    <h4
                                      className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}
                                    >
                                      <Terminal className="w-4 h-4" /> MIÊU TẢ
                                      VĂN HỌC
                                    </h4>
                                    <CharacterTextArea
                                      label="MIÊU TẢ BẰNG NGÔN TỪ VĂN HỌC"
                                      value={npc.literaryDescription}
                                      onChange={(val) => {
                                        const n = [...npcs];
                                        n[idx] = {
                                          ...n[idx],
                                          literaryDescription: val,
                                        };
                                        setNpcs(n);
                                      }}
                                      rows={6}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                      <button
                        onClick={() =>
                          setNpcs([
                            ...npcs,
                            {
                              name: "",
                              fullName: "",
                              titles: "",
                              occupation: "",
                              gender: "",
                              age: "",
                              dob: "",
                              height: "",
                              weight: "",
                              measurements: "",
                              appearance: "",
                              appearanceLite: "",
                              background: "",
                              rank: "",
                              powers: [],
                              skills: [],
                              role: "",
                              personality: "",
                              personalityCore: "",
                              philosophy: "",
                              distinguishingFeatures: "",
                              innerSecret: "",
                              relationships: [],
                              loveViews: "",
                              experience: "",
                              nsfwPersonality: "",
                              nsfwReactions: "",
                              literaryDescription: "",
                              goal: "",
                              needs: "",
                              preferences: { sfw: "", nsfw: "" },
                            },
                          ])
                        }
                        className="w-full py-8 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-white/50 hover:text-white cursor-pointer group"
                      >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        <span className="font-bold uppercase tracking-widest text-sm">
                          Triệu hồi NPC mới
                        </span>
                      </button>
                    </div>
                  )}

                  {activeTab === "items" && (
                    <div className="space-y-8">
                      <div className="space-y-4 mb-8">
                        <h3 className={`text-lg font-bold ${theme.textPrimary} flex items-center gap-2`}>
                          <Sparkles className="w-5 h-5" /> Ý TƯỞNG DÀNH RIÊNG CHO LOCATION
                        </h3>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          Bạn có thể thêm yêu cầu cụ thể về địa điểm (vd: "Thêm một thư viện bí ẩn trong trường học"). 
                          AI sẽ giữ nguyên các địa điểm hiện có và sáng tạo thêm.
                        </p>
                        <textarea
                          value={locationIdea}
                          onChange={(e) => setLocationIdea(e.target.value)}
                          placeholder="Mô tả ý tưởng về địa điểm..."
                          className="w-full theme-input px-4 py-3 rounded-xl min-h-[100px] resize-y"
                        />
                        <button
                          onClick={handleGenerateLocation}
                          disabled={isGeneratingLocation}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-600/30 transition-all cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                        >
                          {isGeneratingLocation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Đang Khởi Tạo...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              Tạo Location
                            </>
                          )}
                          {!isGeneratingLocation && (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                          )}
                        </button>
                      </div>

                      <section className="space-y-4">
                        <LocationArrayEditor
                          label="CÁC ĐỊA ĐIỂM (LOCATIONS)"
                          items={worldDetails.locations || []}
                          onChange={(val) => setWorldDetails({ ...worldDetails, locations: val })}
                        />
                      </section>

                      {/* Giữ lại trường places cũ cho tương thích (hoặc bạn có thể giấu đi nếu không dùng nữa) */}
                      <section className="space-y-4 mt-8 opacity-50">
                        <CharacterTextArea
                          label="GHI CHÚ ĐỊA ĐIỂM KHÁC (Legacy)"
                          value={worldDetails.places || ""}
                          onChange={(val) =>
                            setWorldDetails({ ...worldDetails, places: val })
                          }
                          placeholder="Mô tả chi tiết các phòng ban..."
                        />
                      </section>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper Components for Character Forms
function CharacterInput({
  label,
  value,
  onChange,
  placeholder,
  onAIGen,
  isGenerating,
  description,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onAIGen?: () => void;
  isGenerating?: boolean;
  description?: string;
}) {
  const theme = useStore((state) => state.theme);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1.5 mb-1">
        <div className="flex items-center justify-between">
          <label
            className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === "Dark" ? "text-white/40" : "text-slate-500"}`}
          >
            {label}
          </label>
          {onAIGen && (
            <button
              onClick={onAIGen}
              disabled={isGenerating}
              className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-widest px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                isGenerating
                  ? "opacity-50 cursor-not-allowed border-purple-500/30 text-purple-400 bg-purple-500/10"
                  : theme.group === "Dark"
                    ? "border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                    : "border-black/10 hover:bg-black/5 text-[#334155]"
              }`}
              title="AI tự động sáng tạo nội dung cho mục này dựa trên các mục khác"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3 text-purple-500" />
              )}{" "}
              AI Gen
            </button>
          )}
        </div>
        {description && (
          <p
            className={`text-[11px] pl-1 pr-1 leading-relaxed ${theme.group === "Dark" ? "text-white/35" : "text-slate-500"} italic`}
          >
            {description}
          </p>
        )}
      </div>
      <textarea
        ref={textareaRef}
        rows={1}
        value={
          typeof localValue === "string"
            ? localValue.replace(/<br\s*\/?>/gi, "\n")
            : localValue
        }
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) onChange(localValue);
        }}
        placeholder={placeholder}
        className="w-full theme-input px-4 py-3 rounded-xl transition-all font-medium resize-none overflow-hidden"
      />
    </div>
  );
}

function CharacterTextArea({
  label,
  value,
  onChange,
  rows = 1,
  placeholder = "",
  variant = "default",
  onAIGen,
  isGenerating,
  description,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  variant?: "default" | "large" | "title" | "npc-header";
  onAIGen?: () => void;
  isGenerating?: boolean;
  description?: string;
}) {
  const theme = useStore((state) => state.theme);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const getVariantStyles = () => {
    switch (variant) {
      case "large":
        return "px-8 py-6 rounded-[2rem] text-lg min-h-[120px]";
      case "title":
        return "px-8 py-6 rounded-[2rem] text-2xl font-bold shadow-inner";
      case "npc-header":
        return "px-6 py-4 rounded-2xl text-lg font-bold min-h-[60px]";
      default:
        return "px-6 py-4 rounded-2xl text-sm min-h-[80px]";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex flex-col gap-1.5 mb-1">
          <div className="flex items-center justify-between">
            <label
              className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === "Dark" ? "text-white/40" : "text-slate-500"}`}
            >
              {label}
            </label>
            {onAIGen && (
              <button
                onClick={onAIGen}
                disabled={isGenerating}
                className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-widest px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  isGenerating
                    ? "opacity-50 cursor-not-allowed border-purple-500/30 text-purple-400 bg-purple-500/10"
                    : theme.group === "Dark"
                      ? "border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                      : "border-black/10 hover:bg-black/5 text-[#334155]"
                }`}
                title="AI tự động sáng tạo nội dung cho mục này dựa trên các mục khác"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 text-purple-500" />
                )}{" "}
                AI Gen
              </button>
            )}
          </div>
          {description && (
            <p
              className={`text-[11px] pl-1 pr-1 leading-relaxed ${theme.group === "Dark" ? "text-white/35" : "text-slate-500"} italic`}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={
          typeof localValue === "string"
            ? localValue.replace(/<br\s*\/?>/gi, "\n")
            : localValue
        }
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) onChange(localValue);
        }}
        rows={rows}
        placeholder={placeholder}
        className={`w-full theme-input transition-all resize-none font-medium leading-relaxed overflow-hidden scrollbar-hide ${getVariantStyles()}`}
      />
    </div>
  );
}

function LocationArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Array<{ name: string; description: string }>;
  onChange: (val: Array<{ name: string; description: string }>) => void;
}) {
  const theme = useStore((state) => state.theme);
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-2">
      {label && (
        <label
          className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === "Dark" ? "text-white/40" : "text-slate-500"}`}
        >
          {label}
        </label>
      )}
      <div className="space-y-4">
        {arr.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border flex flex-col gap-3 ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-sm"}`}
          >
            <CharacterInput
              label="Tên địa điểm (từ lớn đến nhỏ)"
              value={item.name || ""}
              onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], name: val };
                onChange(newArr);
              }}
              placeholder="Ví dụ: Trường học - Lớp 12A"
            />
            <CharacterTextArea
              label="Mô tả chi tiết"
              value={item.description || ""}
              onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], description: val };
                onChange(newArr);
              }}
              placeholder="Nơi đó có gì và trông như thế nào..."
            />
            <button
              onClick={() => {
                const newArr = arr.filter((_, idx) => idx !== i);
                onChange(newArr);
              }}
              className="px-3 py-1.5 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            >
              Xóa địa điểm
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newArr = [...arr, { name: "", description: "" }];
            onChange(newArr);
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${theme.group === "Dark" ? "border-white/20 hover:bg-white/10 text-white/70" : "border-black/10 hover:bg-black/5 text-[#334155]"} cursor-pointer`}
        >
          + Thêm địa điểm
        </button>
      </div>
    </div>
  );
}

function ArrayItemEditor({
  label,
  items,
  onChange,
  itemLabel = "Item",
}: {
  label: string;
  items: Array<any>;
  onChange: (val: Array<any>) => void;
  itemLabel?: string;
}) {
  const theme = useStore((state) => state.theme);
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-2">
      {label && (
        <label
          className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === "Dark" ? "text-white/40" : "text-slate-500"}`}
        >
          {label}
        </label>
      )}
      <div className="space-y-4">
        {arr.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border flex flex-col gap-3 ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-sm"}`}
          >
            <div className="flex gap-3">
              <div className="flex-[2]">
                <CharacterInput
                  label={`Tên ${itemLabel}`}
                  value={item.name || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], name: val };
                    onChange(newArr);
                  }}
                />
              </div>
              <div className="flex-1">
                <CharacterInput
                  label="Loại"
                  value={item.type || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], type: val };
                    onChange(newArr);
                  }}
                />
              </div>
              <div className="flex-1">
                <CharacterInput
                  label="Cấp độ"
                  value={item.level || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], level: val };
                    onChange(newArr);
                  }}
                />
              </div>
            </div>
            <CharacterTextArea
              label="Mô tả chi tiết"
              value={item.description || ""}
              onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], description: val };
                onChange(newArr);
              }}
            />
            <button
              onClick={() => {
                const newArr = arr.filter((_, idx) => idx !== i);
                onChange(newArr);
              }}
              className="px-3 py-1.5 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            >
              Xóa
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newArr = [
              ...arr,
              { name: "", description: "", type: "", level: "" },
            ];
            onChange(newArr);
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${theme.group === "Dark" ? "border-white/20 hover:bg-white/10 text-white/70" : "border-black/10 hover:bg-black/5 text-[#334155]"} cursor-pointer`}
        >
          + Thêm {itemLabel}
        </button>
      </div>
    </div>
  );
}

function RelationshipArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Array<any>;
  onChange: (val: Array<any>) => void;
}) {
  const theme = useStore((state) => state.theme);
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-2">
      {label && (
        <label
          className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === "Dark" ? "text-white/40" : "text-slate-500"}`}
        >
          {label}
        </label>
      )}
      <div className="space-y-4">
        {arr.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border flex flex-col gap-3 ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-white/80 border-black/10 shadow-sm"}`}
          >
            <div className="flex gap-3">
              <div className="flex-[2]">
                <CharacterInput
                  label="Họ và tên nhân vật"
                  value={item.name || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], name: val };
                    onChange(newArr);
                  }}
                />
              </div>
              <div className="flex-[1.5]">
                <CharacterInput
                  label="Mối quan hệ"
                  value={item.relation || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], relation: val };
                    onChange(newArr);
                  }}
                />
              </div>
              <div className="flex-[1.5]">
                <CharacterInput
                  label="Tình trạng"
                  value={item.status || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], status: val };
                    onChange(newArr);
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-[2]">
                <CharacterInput
                  label="Ấn tượng và suy nghĩ"
                  value={item.impression || ""}
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = { ...newArr[i], impression: val };
                    onChange(newArr);
                  }}
                />
              </div>
              <div className="flex-[1.5]">
                <CharacterInput
                  label="Cách xưng hô với họ (cách nhau bởi phẩy)"
                  value={
                    Array.isArray(item.termsOfAddress)
                      ? item.termsOfAddress.join(", ")
                      : item.termsOfAddress || ""
                  }
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = {
                      ...newArr[i],
                      termsOfAddress: val
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    };
                    onChange(newArr);
                  }}
                />
              </div>
              <div className="flex-[1.5]">
                <CharacterInput
                  label="Cách tự xưng bản thân (cách nhau bởi phẩy)"
                  value={
                    Array.isArray(item.selfAppellation)
                      ? item.selfAppellation.join(", ")
                      : item.selfAppellation || ""
                  }
                  onChange={(val) => {
                    const newArr = [...arr];
                    newArr[i] = {
                      ...newArr[i],
                      selfAppellation: val
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                    };
                    onChange(newArr);
                  }}
                />
              </div>
            </div>
            <CharacterTextArea
              label="Mô tả chi tiết"
              value={item.description || ""}
              onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], description: val };
                onChange(newArr);
              }}
            />
            <button
              onClick={() => {
                const newArr = arr.filter((_, idx) => idx !== i);
                onChange(newArr);
              }}
              className="px-3 py-1.5 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            >
              Xóa
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newArr = [
              ...arr,
              { name: "", relation: "", status: "", description: "" },
            ];
            onChange(newArr);
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${theme.group === "Dark" ? "border-white/20 hover:bg-white/10 text-white/70" : "border-black/10 hover:bg-black/5 text-[#334155]"} cursor-pointer`}
        >
          + Thêm Mối Quan Hệ
        </button>
      </div>
    </div>
  );
}
