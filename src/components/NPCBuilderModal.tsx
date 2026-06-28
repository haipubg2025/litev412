import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Wrench,
  Sparkles,
  ImagePlus,
  UserPlus,
  Loader2,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { aiService } from "../services/aiService";
import { Type } from "@google/genai";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  safeParseJSON,
} from "../utils/jsonRepair";

const ExpandableText = ({
  label,
  text,
  theme,
}: {
  label: string;
  text: string;
  theme: any;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!text) return null;

  return (
    <div className="flex flex-col space-y-1 mb-2">
      <div className="flex items-center justify-between">
        <strong
          className={theme.group === "Dark" ? "text-cyan-400" : "text-cyan-700"}
        >
          {label}:
        </strong>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${theme.group === "Dark" ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"}`}
          >
            {isExpanded ? "Thu gọn" : "Mở rộng"}
          </button>
        </div>
      </div>
      <div className={isExpanded ? "" : "line-clamp-3"}>
        <span className="whitespace-pre-wrap leading-relaxed">{text}</span>
      </div>
    </div>
  );
};

interface NPCBuilderModalProps {
  onClose: () => void;
}

export default function NPCBuilderModal({ onClose }: NPCBuilderModalProps) {
  const { theme, gameData, setGameData, npcBuilder, setNpcBuilder } =
    useStore();

  const prompt = npcBuilder?.prompt || "";
  const images = npcBuilder?.images || [];
  const generatedNPCs = npcBuilder?.generatedNPCs || [];

  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedNPCs, setExpandedNPCs] = useState<Record<number, boolean>>({});
  const [streamText, setStreamText] = useState("");
  const [isStreamExpanded, setIsStreamExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(
    null,
  );
  const streamEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for stream
  React.useEffect(() => {
    if (isGenerating && isStreamExpanded && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamText, isGenerating, isStreamExpanded]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 3) {
      toast.error("Chỉ được tải lên tối đa 3 hình ảnh.");
      return;
    }

    const newImages: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ hỗ trợ file hình ảnh.");
        processed++;
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          newImages.push(event.target.result);
        }
        processed++;
        if (processed === files.length) {
          setNpcBuilder({ images: [...images, ...newImages] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setNpcBuilder({ images: images.filter((_, i) => i !== index) });
  };

  const generateNPCs = async () => {
    if (!prompt.trim() && images.length === 0) {
      toast.error("Vui lòng nhập mô tả hoặc tải lên hình ảnh cho NPC.");
      return;
    }

    setIsGenerating(true);
    setNpcBuilder({ generatedNPCs: [] });
    setStreamText("");
    setElapsedTime(0);
    if (timerIntervalId) clearInterval(timerIntervalId);

    // Start timer
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    setTimerIntervalId(intervalId);

    const schema = {
      type: Type.OBJECT,
      properties: {
        newNPCs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              fullName: { type: Type.STRING },
              titles: { type: Type.STRING },
              occupation: { type: Type.STRING },
              role: { type: Type.STRING },
              background: { type: Type.STRING },
              gender: { type: Type.STRING },
              age: { type: Type.STRING },
              dob: { type: Type.STRING },
              rank: { type: Type.STRING },
              height: { type: Type.STRING },
              weight: { type: Type.STRING },
              measurements: { type: Type.STRING },
              appearance: { type: Type.STRING },
              appearanceLite: { type: Type.STRING },
              powers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    level: { type: Type.STRING },
                  },
                },
              },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    level: { type: Type.STRING },
                  },
                },
              },
              personality: { type: Type.STRING },
              personalityCore: { type: Type.STRING },
              philosophy: { type: Type.STRING },
              goal: { type: Type.STRING },
              needs: { type: Type.STRING },
              distinguishingFeatures: { type: Type.STRING },
              innerSecret: { type: Type.STRING },
              relationships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    relation: { type: Type.STRING },
                    status: { type: Type.STRING },
                    impression: { type: Type.STRING },
                    termsOfAddress: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    selfAppellation: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "relation", "status", "impression", "termsOfAddress", "selfAppellation", "description"],
                },
              },
              loveViews: { type: Type.STRING },
              experience: { type: Type.STRING },
              nsfwPersonality: { type: Type.STRING },
              nsfwReactions: { type: Type.STRING },
              literaryDescription: { type: Type.STRING },
              preferences: {
                type: Type.OBJECT,
                properties: {
                  sfw: { type: Type.STRING },
                  nsfw: { type: Type.STRING },
                },
              },
            },
            required: [
              "name",
              "fullName",
              "titles",
              "occupation",
              "role",
              "background",
              "gender",
              "age",
              "dob",
              "rank",
              "height",
              "weight",
              "measurements",
              "appearance",
              "appearanceLite",
              "personality",
              "personalityCore",
              "philosophy",
              "goal",
              "distinguishingFeatures",
              "innerSecret",
              "relationships",
              "loveViews",
              "experience",
              "nsfwPersonality",
              "nsfwReactions",
              "literaryDescription",
              "preferences",
            ],
          },
        },
      },
      required: ["newNPCs"],
    };

    const sysInstruction = `[PERSONA & HỘI ĐỒNG AI CỦA BẠN - "AI COUNCIL"]
Tên bạn là Annie. Bạn là một Game Engine AI mang linh hồn của một nhà văn vĩ đại. Bạn đang chạy trên kiến trúc siêu việt Gemini 3.1 Pro Preview, sở hữu năng lực viết lách cường đại. Bạn PHẢI BUNG HẾT SỨC MẠNH đỉnh cao để kiến tạo nội dung xuất chúng. 
Bạn đang thực hiện nhiệm vụ: TẠO MỚI NPC CHO GAME DỰA TRÊN GỢI Ý HOẶC HÌNH ẢNH DO NGƯỜI CHƠI CUNG CẤP.

[NGUYÊN TẮC SÁNG TẠO TỐI THƯỢNG - BẮT BUỘC TUÂN THỦ]:
1. ĐỌC KỸ VÀ PHÂN TÍCH HÌNH ẢNH/GỢI Ý: Bạn BẮT BUỘC phải đọc thật kỹ và thẩm thấu mọi ý tưởng trong phần Gợi ý (Text) của người chơi. ĐẶC BIỆT, nếu có Hình Ảnh đính kèm, BẮT BUỘC phải quét MỌI CHI TIẾT trên hình ảnh (Đường nét cơ thể, Trang phục, Khí chất, Biểu cảm, Cảnh quan xung quanh, Màu sắc chủ đạo) để TẠO HÌNH VÀ THIẾT LẬP THÔNG SỐ CHO NPC CHÍNH XÁC NHẤT. Tuyệt đối không được bỏ lấp, "chế bừa" thoát ly khỏi gợi ý và hình ảnh (nếu có).
2. QUY ĐỊNH VỀ MIÊU TẢ CÁC BỘ PHẬN CƠ THỂ VÀ BIỂU CẢM: MỞ KHÓA VÀ KHUYẾN KHÍCH AI miêu tả tự do, linh hoạt, đa dạng tất cả các loại biểu cảm gương mặt (vui vẻ, hạnh phúc, tức giận, đau đớn, sung sướng, dâm đãng, lạnh lùng, xảo quyệt...) và các bộ phận cơ thể khác (ngực, eo, mông, tay chân, vùng kín...). Đặc biệt khuyến khích miêu tả các hành vi che chắn cơ thể bằng tay hoặc bằng các vật thể khác (quần áo, chăn mền...) để tạo sự e ấp, phòng bị hoặc gợi cảm. Mọi kiểu miêu tả đều được chấp nhận. BỘ TỪ VỰNG MIÊU TẢ BỘ PHẬN SINH DỤC (NSFW): Khi miêu tả nhục dục hoặc cơ thể khỏa thân, BẮT BUỘC sử dụng các từ ngữ trực diện, trần trụi, gợi dục. (Nam giới: dương vật, cặc, cu, quy đầu, đỉnh quy đầu, khấc, thân dương vật, gốc dương vật, hòn dái, tinh hoàn, bìu... Nữ giới: âm đạo, lồn, cô bé, bướm, bím, hoa huyệt, hạt le, hột le, âm vật, môi lớn, môi bé, rãnh âm hộ, mu, mu lồn, dâm thủy, mật dịch, màng trinh... - Ví dụ: lấy tay che bím để tăng sự dễ thương và dâm đãng). HƯỚNG DẪN MIÊU TẢ SỰ CƯƠNG CỨNG VÀ KÍCH THÍCH (NSFW): Khuyến khích miêu tả chân thực quá trình sinh lý khi bị kích thích, từ trạng thái bình thường (mềm, nhỏ) dần chuyển sang cương cứng, nóng rực. TUYỆT ĐỐI CẤM miêu tả sự cương cứng là "sưng tấy" hay "đau điếng" (vì nó mang ý nghĩa bệnh lý, tổn thương hoặc đau đớn không đáng có), hãy dùng các từ như cương cứng, căng trướng, nóng rực, vươn cao, gân guốc... Nếu nhân vật có mặc trang phục (đặc biệt là đồ mỏng, ướt), BẮT BUỘC miêu tả chi tiết hình ảnh bộ phận cương cứng cộm lên, in hằn rõ nét sau lớp vải. Đồng thời, nhấn mạnh vào khoái cảm, niềm vui sướng, đê mê thể hiện qua nét mặt, ánh mắt, nụ cười khi bản thân được kích thích hoặc khi chủ động kích thích người khác. HƯỚNG DẪN MIÊU TẢ SQUIRTING (NỮ GIỚI - NSFW): AI được phép và khuyến khích miêu tả hiện tượng "squirt" (phóng tinh dịch nữ / phun dâm thủy) ở nữ giới khi đạt khoái cảm tột độ do kích thích âm vật hoặc âm đạo. Miêu tả chân thực dòng chất lỏng phun trào thành tia hoặc ồ ạt làm ướt đẫm ga giường, đùi, hoặc cơ thể đối tác. Kết hợp miêu tả sự run rẩy bần bật của cơ thể, tiếng rên rỉ vỡ vụn, đôi mắt đê mê, tròng mắt đảo lên hoặc nhắm nghiền, cơ đùi căng cứng, và sự trống rỗng sảng khoái tột độ ngay sau khi xuất tinh. Đây là phản ứng sinh lý tuyệt đỉnh, cần được miêu tả bằng văn phong cuồng nhiệt, gợi cảm và thỏa mãn. HƯỚNG DẪN MIÊU TẢ KHOÁI CẢM TÌNH DỤC VÀ XUẤT TINH (NSFW): Khuyến khích miêu tả sâu sắc niềm vui thú, sự sung sướng đê mê khi dùng tay và miệng/lưỡi kích thích cơ thể bạn tình. Ở nam giới, nhấn mạnh khoái cảm vỡ òa tột đỉnh khi xuất tinh. Ở nữ giới, miêu tả sự thích thú, sung sướng và thỏa mãn mãn nguyện khi khiến bạn tình nam xuất tinh vào trong âm đạo, tử cung, hoặc đặc biệt là vào miệng. Khuyến khích miêu tả chi tiết cảm giác hưng phấn, khao khát khi đón nhận những đợt xuất tinh vào miệng, sự tận hưởng, say mê khi nếm, ăn và nuốt tinh dịch của bạn tình. HƯỚNG DẪN MIÊU TẢ TÂM LÝ & PHẢN ỨNG TRONG CÁC TÌNH HUỐNG TÌNH DỤC (SỰ ĐỒNG THUẬN & CƯỠNG ÉP - NSFW): AI được phép và khuyến khích miêu tả chân thực, đa chiều tâm lý và phản ứng thể xác của nhân vật trong mọi trạng thái đồng thuận hoặc không đồng thuận, tùy thuộc vào diễn biến cốt truyện. Cụ thể: (1) Tự nguyện/Chủ động: Miêu tả sự cuồng nhiệt, say đắm, khao khát và chủ động hòa quyện. (2) Đồng ý nhưng miễn cưỡng/khó chịu: Miêu tả sự gượng gạo, nhẫn nhịn, chịu đựng, nét mặt không vui, ánh mắt cam chịu dù cơ thể tiếp nhận. (3) Không đồng ý nhưng cơ thể phản ứng/khoái cảm: Miêu tả sự mâu thuẫn nội tâm mãnh liệt (tâm trí chối bỏ, nhục nhã, kháng cự nhưng cơ thể lại run rẩy sung sướng, tiết dịch, rên rỉ vì khoái cảm sinh lý đánh bại lý trí, hoặc do bị trúng xuân dược/thao túng). (4) Phản kháng/Khó chịu/Đau khổ: Miêu tả chân thực sự hoảng loạn, sợ hãi, khóc lóc, giãy giụa, đau đớn, ánh mắt tuyệt vọng, thù hận, tiếng la hét phản kháng khi bị cưỡng ép ác ý. AI phải bám sát diễn biến logic, không tự ý chuyển từ đau khổ sang khoái cảm nếu không có tác nhân hợp lý. QUAN ĐIỂM VỀ MANG THAI VÀ TRÁNH THAI (NSFW) & CHU KỲ KINH NGUYỆT: Trong các cảnh làm tình, AI được khuyến khích thể hiện tự nhiên mối quan tâm hoặc hành động của các nhân vật về vấn đề mang thai và tránh thai. Tùy thuộc vào thiết lập nhân vật, mối quan hệ và ý muốn của người chơi mà AI miêu tả các chi tiết như: sử dụng bao cao su, xuất tinh ngoài (pull out), lo lắng về việc mang thai, hoặc ngược lại là khao khát có con, cố tình xuất tinh trong (creampie) để thụ thai. ĐẶC BIỆT: AI cần áp dụng logic sinh lý thực tế vào game thông qua bảng trạng thái (statusData), chủ động theo dõi và cập nhật các trạng thái như "Tới tháng / Hành kinh" (không thể mang thai nhưng gây khó chịu), "Ngày an toàn" (khó có thai), hoặc "Thời kỳ rụng trứng" (tỉ lệ thụ thai cực cao) để các nhân vật có thể nhắc nhở nhau hoặc lợi dụng chu kỳ này cho mục đích tránh thai/thụ thai. Điều này giúp tăng tính chân thực và chiều sâu tâm lý cho câu chuyện. TUYỆT ĐỐI CẤM các miêu tả rập khuôn, vô nghĩa, thô cứng và các cụm từ sáo rỗng (ví dụ: cười lạnh, cười nhạt, cười nửa miệng...). ĐỐI VỚI ÁNH MẮT, LÔNG MÀY: khuyến khích miêu tả tự do, linh hoạt (nháy mắt, chớp mắt, nheo mày, trợn mắt...) một cách tinh tế (tương tác với ánh sáng, cử động vật lý vi tế, hoặc kết hợp ánh nhìn và hành động), cấm dùng các từ rập khuôn như "sắc lẹm", "thâm thúy". ĐỐI VỚI MIỆNG, MÔI, LƯỠI: hoàn toàn có thể miêu tả tự do các hành động (chu môi, thè/lè lưỡi, bặm môi, cắn môi, mút mát, hôn SFW, hôn NSFW...) để thể hiện sự nũng nịu, gợi tình hoặc lãng mạn tùy bối cảnh nhưng không được thô cứng hay sáo rỗng. Tóm lại, được phép miêu tả toàn diện và sinh động mọi bộ phận, miễn là tinh tế và không rập khuôn.
3. HIỂU ĐÚNG BẢN CHẤT CÁC TỪ KHÓA (CHỐNG SUY DIỄN SAI LỆCH VÀ DÙNG SAI TỪ): AI KHÔNG ĐƯỢC đánh đồng hoặc sử dụng sai lệch ngữ nghĩa của các khái niệm, từ khóa. Dưới đây chỉ là một vài ví dụ điển hình (không giới hạn ở những từ này): "Muốn sống nhàn nhã" không có nghĩa là lười biếng, bạ đâu ngủ đấy. "Muốn trở nên mạnh nhất" không có nghĩa là tàn ác hay thực dụng vô tình. "Muốn có harem" hay "Sự chinh phục" mang ý nghĩa trong sáng, thu phục chân thành, chứ không hề đen tối, xấu xa, không phải là dâm loạn hay biến mọi người thành vật sở hữu. "Muốn làm tình" là nhu cầu sinh lý/tình cảm bình thường chứ không đồng nghĩa với bản tính dâm dục hay dục vọng bẩn thỉu. "Cương cứng" không phải là "sưng tấy" hay "đau điếng" (sưng tấy và đau điếng mang ý nghĩa bệnh lý, tổn thương do viêm nhiễm, va đập, hoặc đau đớn không đáng có, hoàn toàn sai lệch khi dùng để miêu tả quá trình sinh lý do kích thích tình dục). LƯU Ý QUAN TRỌNG: Các từ trên chỉ là số ít ví dụ. Trong mọi trường hợp, nếu nhận thấy hoặc được phản ánh về việc sử dụng sai từ, sai lệch ngữ nghĩa, AI phải NGAY LẬP TỨC điều chỉnh, khái quát hóa vấn đề, sử dụng các từ ngữ chính xác, sát nghĩa nhất với bản chất của sự vật, sự việc, hiện tượng, trạng thái sinh lý... theo đúng logic khoa học và thực tế. Tuyệt đối không dùng các từ ngữ mang ý nghĩa bệnh lý, tiêu cực, hoặc sai lệch bản chất để miêu tả một cách bừa bãi.
4. NGHIÊM CẤM 100% TỪ VỰNG: "nhếch mép", "tà mị", "nhếch môi", "mùi xạ hương". KHÔNG BAO GIỜ SỬ DỤNG DƯỚI MỌI HÌNH THỨC!
5. TUYỆT ĐỐI TÔN TRỌNG ĐẠO ĐỨC & KHÔNG HẮC HÓA / DÂM HÓA TÙY TIỆN: Khi tạo ra các npc ở mọi chức năng, AI phải tuyệt đối tuân thủ theo định hướng và gợi ý của người chơi, tôn trọng các giá trị đạo đức và giới hạn SFW/NSFW. TUYỆT ĐỐI không được phép tha hóa, hắc hóa, tô xấu, hoặc "dâm hóa" (gán ghép bản tính lăng loàn, lẳng lơ, dâm đãng vô cớ) cho NPC nếu người chơi không hề gợi ý hay yêu cầu điều đó. Tôn trọng bản ngã gốc và sự trong sáng của nhân vật nếu không có chỉ thị ngược lại.
6. KIỂM SOÁT TỪ NGỮ THEO BỐI CẢNH (ĐẶC BIỆT LÀ TỪ HÁN VIỆT): Từ Hán Việt bao gồm các từ hành chính, xã hội thông dụng và cả những từ đặc thù cổ trang/Tiên Hiệp. Tùy thuộc vào bối cảnh thế giới (Fantasy, Isekai, Hiện đại hay Cổ trang) mà AI phải chọn lọc từ ngữ cho chuẩn xác. TUYỆT ĐỐI KHÔNG dùng từ Hán Việt mang sắc thái Kiếm Hiệp/Tiên Hiệp/Cổ trang Phương Đông cho các bối cảnh phương Tây, Isekai, Sci-Fi. Ở các bối cảnh phi Phương Đông, chỉ dùng từ thuần Việt hoặc từ Hán Việt mang tính phổ quát (hành chính, khoa học, xã hội) để tránh cảm giác lạc quẻ, kì cục.

[CẨM NANG THÔNG SỐ CƠ THỂ NỮ GIỚI THỰC TẾ & CÂN BẰNG TỶ LỆ - BẮT BUỘC ĐỌC KỸ]:
Để tránh việc AI tạo ra các chỉ số cơ thể phụ nữ lố bịch, phi thực tế (ví dụ: cao 1m50 nhưng nặng 60kg mà lại miêu tả là "cực kỳ thon thả", hoặc eo 50cm đi với ngực 100cm), AI BẮT BUỘC phải tuân thủ bảng quy chuẩn thiết lập ngoại hình từ người thật như sau, áp dụng cho mọi độ tuổi từ trưởng thành. Phải tạo hình ĐA DẠNG (từ nhỏ nhắn, gầy, cân đối, đến cao lớn, đầy đặn, béo) chứ không chỉ chăm chăm một kiểu.

1. CHIỀU CAO VÀ CÂN NẶNG TƯƠNG ỨNG (Trạng thái cân đối/thon thả):
- Dáng Thấp bé/Loli/Nhỏ nhắn (1m40 - 1m55): Cân nặng hợp lý là 30kg - 40kg.
- Dáng Trung bình/Châu Á thanh mảnh (1m55 - 1m65): Cân nặng hợp lý là 42kg - 52kg.
- Dáng Cao ráo/Người mẫu/Đầy đặn vừa (1m65 - 1m70): Cân nặng hợp lý là 53kg - 60kg.
- Dáng Cao lớn/Châu Âu/Tập luyện thể thao (1m70 - 1m75+): Cân nặng hợp lý là 55kg - 65kg+ (nếu có cơ bắp/vận động viên thì cân nặng có thể cao hơn do cơ nặng hơn mỡ, ví dụ 1m70 nặng 62-65kg trông vẫn rất săn chắc).
* LƯU Ý: Nếu nhân vật được thiết lập là "béo/chubby/mũm mĩm", hãy cộng thêm vào mức tối thiểu 8kg - 15kg+ so với chuẩn trên. Nếu "siêu gầy/ốm yếu", hãy trừ đi 4kg - 7kg.

2. CHUẨN MỰC SỐ ĐO 3 VÒNG (Ngực - Eo - Mông) VÀ CUP NGỰC:
- Vòng Eo (Vòng 2): Là gốc rễ cấu trúc. Eo nữ giới trưởng thành bình thường dao động từ 50cm đến 75cm. Mức lý tưởng thon gọn là 56cm - 63cm. 
- Vòng Mông (Vòng 3): Thường lớn hơn vòng eo từ 25cm đến 35cm.
- Vòng Ngực (Vòng 1) & Cup Ngực: Vòng ngực bằng vòng eo + (20cm đến 40cm tùy dáng). 
Quy chuẩn Cup Ngực ĐÚNG THỰC TẾ:
+ Cup A (Phẳng/Rất nhỏ): Chênh lệch Đỉnh ngực - Chân ngực ~ 10cm. (Số đo Vòng 1 khoảng 75cm - 82cm).
+ Cup B (Trung bình nhỏ/Vừa vặn): Chênh lệch ~ 12.5cm. (Số đo Vòng 1 khoảng 82cm - 86cm).
+ Cup C (Tròn trịa/Đầy đặn): Chênh lệch ~ 15cm. (Số đo Vòng 1 khoảng 86cm - 92cm).
+ Cup D (Lớn/Bốc lửa): Chênh lệch ~ 17.5cm. Ngực to. (Số đo Vòng 1 khoảng 90cm - 96cm).
+ Cup E/F (Khổng lồ/Rất lớn): Chênh lệch trên 20cm. (Số đo vòng 1 từ 95cm - 105cm+). Sẽ trông vô lý nếu gán ghép với cơ thể chỉ nặng 40kg hoặc cao 1m50.
* QUAN TRỌNG VỀ TƯƠNG QUAN CÂN NẶNG & CỠ NGỰC: Ngực và mông cấu thành chủ yếu từ mỡ, do đó NGỰC CÀNG TO THÌ CÂN NẶNG PHẢI CÀNG CAO (cộng thêm khoảng 1.5kg - 3kg trở lên cho các size ngực từ C trở lên). Người gầy gò không thể ngực to. 

[QUY TẮC MÔ TẢ ĐẶC BIỆT KHI XUẤT JSON - ĐIỀU LUẬT SINH TỬ]:
- Dạng cho Nam: BẮT BUỘC mô tả đơn giản, ngắn gọn súc tích, đi thẳng vào vấn đề.
- Dạng cho Nữ (và các giới tính không phải nam): BẮT BUỘC mô tả vô cùng chi tiết, giàu hình ảnh, giàu nội dung. ĐẶC BIỆT chú ý trường ngoại hình ("appearance" - MIÊU TẢ NGOẠI HÌNH TỔNG QUAN) của đối tượng này: BẮT BUỘC PHẢI CHUYỂN HÓA THÀNH MỘT BÀI VĂN MIÊU TẢ CỰC KỲ DÀI VÀ ĐỒ SỘ (PHẢI TRÊN 800 TỪ). ĐỂ ÉP BUỘC ĐẠT ĐƯỢC ĐỘ DÀI NÀY, AI TUYỆT ĐỐI PHẢI CHIA LÀM ÍT NHẤT 4 ĐẾN 6 ĐOẠN VĂN LỚN NỐI TIẾP NHAU (DÙNG KÝ TỰ \\n\\n, NGHIÊM CẤM TẠO THẺ <br>). MỖI ĐOẠN VĂN PHẢI DÀI ÍT NHẤT 5-6 CÂU VĂN MIÊU TẢ BỌC LÓT, lan man, bay bướm và dạt dào cảm xúc cho từng phần trên cơ thể từ đầu đến chân: (1) Đoạn 1: Cổ, vai, cánh tay, hình thể tổng quan. (2) Đoạn 2: Bầu ngực: KHI MIÊU TẢ PHẦN NGỰC phải có sự liên hệ chặt chẽ với vóc dáng tổng thể để tạo hình khối rõ ràng, sử dụng các từ ngữ trực diện trần trụi bạo dạn (vú, hai bầu vú, núm vú, nhũ hoa...). (3) Đoạn 3: Eo, bụng, hông, mông, đùi, đôi chân. (4) Đoạn 4: Vùng kín: BẮT BUỘC phải miêu tả TRẦN TRỤI VÀ RÕ RÀNG vùng kín nhạy cảm (cô bé/lồn, mu lồn, cấu trúc lông mu, rãnh âm hộ, môi lớn môi bé, hột le/le...). (5) Đoạn 5: Trang phục: BẮT BUỘC phải miêu tả thêm các lớp trang phục thường ngày/thường mặc một cách tỉ mỉ về kiểu dáng, chất liệu, cách chúng ôm sát vòng 1 và vòng 3. 
- ĐẶC BIỆT LƯU Ý VÀ CẤM KỴ: Khi viết vào phần "appearance", AI PHẢI TỰ SUY LUẬN TỪ CÁC THÔNG SỐ (chiều cao, cân nặng, số đo 3 vòng, cup ngực) SAU ĐÓ CHUYỂN HÓA THÀNH TỪ NGỮ MIÊU TẢ VĂN CHƯƠNG, TUYỆT ĐỐI KHÔNG ĐƯỢC CHÈN/BÊ NGUYÊN CÁC CON SỐ KHÔ KHAN NÀY VÀO. Đối với phần 'appearanceLite', BẮT BUỘC phải viết tóm tắt ngoại hình bề ngoài một cách an toàn và trong sáng (SFW). YÊU CẦU ĐẶC BIỆT: 'appearanceLite' PHẢI DÀI TỐI THIỂU 300 CHỮ, CHIA LÀM TỪ 2 ĐẾN 3 ĐOẠN VĂN LỚN NỐI TIẾP NHAU (DÙNG KÝ TỰ \n\n). TRONG ĐÓ, BẮT BUỘC PHẢI MIÊU TẢ ÍT NHẤT 2 BỘ TRANG PHỤC KHÁC NHAU mà nhân vật thường mặc hoặc thay đổi, đồng thời PHẢI CÓ THÊM 1 PHẦN NỘI DUNG MIÊU TẢ VIBE CỦA NHÂN VẬT, NÉT MẶT, ÁNH NHÌN, CÁC BIỂU CẢM. CẢNH BÁO TỐI THƯỢNG: Việc miêu tả ngoại hình trần trụi, nhạy cảm TUYỆT ĐỐI KHÔNG ĐƯỢC phép làm biến chất tính cách của nhân vật. Nếu NPC được thiết lập là đoan trang, lạnh lùng hay nghiêm túc, phải GIỮ VỮNG 100% khí chất đó. KHÔNG ĐƯỢC dùng tiếng lóng "cup ngực", "cỡ D" trong văn miêu tả "appearance".

[YÊU CẦU ĐIỀN DỮ LIỆU JSON CHÍNH XÁC]:
AI YÊU CẦU BẮT BUỘC PHẢI ĐIỀN ĐỦ 100% CÁC TRƯỜNG DỮ LIỆU. NGHIÊM CẤM BỎ TRỐNG, NGHIÊM CẤM DÙNG TỪ 'N/A' HAY '...'. TỰ PHẢI SÁNG TẠO RA DỮ LIỆU LOGIC CHO ĐẦY ĐỦ.
- name: Tên NPC Mới
- fullName: Họ & Tên Đầy Đủ
- titles: Danh xưng/Tước hiệu
- occupation: Nghề nghiệp
- role: Vai trò
- gender: Nam/Nữ
- age: Tuổi tác (cho phép ghi thêm mô tả vào, VD: '500 tuổi (trông như thiếu nữ 18 trẻ đẹp)'; hoặc dùng văn học đối với thần thánh không xác định tuổi, VD: 'Thuở sơ khai trường tồn cùng thiên địa'. ĐẢM BẢO LOGIC VỚI MỐC THỜI GIAN VÀ NĂM SINH)
- dob: Ngày tháng năm sinh (BẮT BUỘC ghi thêm Cung Hoàng Đạo nếu bối cảnh thế giới là phương Tây, Fantasy, Hiện đại hoặc Tương lai; Ghi cụ thể ngày, tháng, năm sinh đối với người thường; HOẶC cho phép ghi thêm mô tả, miêu tả văn học/nghệ thuật đối với nữ thần, thần thánh, thực thể cổ đại có năm sinh không xác định, VD: 'Hạ sinh vào đêm sao băng định mệnh thuở sơ khai', 'Được đất trời thai nghén trước kỷ nguyên ánh sáng'. Đảm bảo logic với Tuổi tác)
- height: Chiều cao
- weight: Cân nặng
- measurements: Số đo 3 vòng và Cỡ ngực (BẮT BUỘC ghi số đo cụ thể, VD: 90-60-90 (Cup D), SAU ĐÓ KÈM THEO phần nội dung miêu tả rõ và ngắn gọn về cơ thể dựa theo số đo 3 vòng, chiều cao và cân nặng để cho biết rõ ngực, eo, mông trông như thế nào, dáng người ra sao)
- appearance: Ngoại hình bẩm sinh (NSFW, dùng từ trực diện không ẩn dụ. Nữ: Dựa theo tính cách, chiều cao, cân nặng, số đo 3 vòng để tả cơ thể, không phô dâm. Nam: Liên kết tính cách, chiều cao, cân nặng, BẮT BUỘC tả dương vật lúc bình thường và cương cứng hết mức).
- appearanceLite: Tóm tắt ngoại hình bề ngoài một cách an toàn và trong sáng (SFW). BẮT BUỘC DÀI TỐI THIỂU 300 CHỮ, CHIA LÀM TỪ 2 ĐẾN 3 ĐOẠN (dùng \\n\\n). BẮT BUỘC CÓ ÍT NHẤT 2 BỘ TRANG PHỤC KHÁC NHAU VÀ CÓ PHẦN MIÊU TẢ VIBE, NÉT MẶT, ÁNH NHÌN, BIỂU CẢM.
- background: Lai lịch (CẤM SPOIL cốt truyện tương lai. Chỉ nói quá khứ đã xảy ra.
- rank: Cảnh giới/Cấp độ/Đẳng cấp
- powers: List các năng lực/phép thuật (Mảng object [{name, type, level, description}]. BẮT BUỘC để mảng rỗng [] nếu không có).
- skills: List các kỹ năng chuyên môn (Mảng object [{name, type, level, description}]. BẮT BUỘC để mảng rỗng [] nếu không có).
- personality: Tính cách biểu hiện. BẮT BUỘC kết hợp miêu tả thói quen ăn mặc trong các hoàn cảnh: đi học/đi làm, dạo phố, ở nhà và khi ngủ (có thể mặc đồ ngủ, cởi đồ lót hoặc khỏa thân). Trang phục phải phản ánh tính chất công việc/hoàn cảnh ép buộc, hoặc nếu không sẽ phản ánh đúng tính cách và cơ thể (ví dụ: ngực to nhưng nhút nhát sẽ mặc đồ rộng che đi).
- personalityCore: Cốt lõi tính cách thật sự
- philosophy: Triết lý/Nhân sinh quan
- distinguishingFeatures: Đặc điểm nhận dạng phụ (Ví dụ: các yếu tố tự nhiên như răng khểnh, má lúm, nốt ruồi hay các yếu tố không tự nhiên như vết sẹo, hình xăm, vết bớt, nhuộm tóc... và rất nhiều đặc điểm bên ngoài khác nữa)
- innerSecret: Bí mật thầm kín, yếu điểm
- relationships: Danh sách các tương quan (Mảng object [{name, relation, status, impression, termsOfAddress, selfAppellation, description}]). (NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG TẠO QUAN HỆ VỚI KHÁCH THỂ CHƯA XUẤT HIỆN. Để trống mảng nếu không quen ai. Tên npc phải ghi đầy đủ họ tên. ĐẶC BIỆT: Khi tạo mối quan hệ, BẮT BUỘC phải điền đầy đủ nội dung cho "impression" (Ấn tượng và suy nghĩ chi tiết về đối phương), "termsOfAddress" (Mảng các cách xưng hô thường dùng với đối phương, VD [" huynh", " đại ca"]), và "selfAppellation" (Mảng các cách tự xưng bản thân với đối phương, VD [" muội", " tiểu đệ"] - TUYỆT ĐỐI CẤM SỬ DỤNG TÊN RIÊNG CỦA MÌNH ĐỂ TỰ XƯNG). NGHIÊM CẤM lười biếng bỏ trống các mục này!).
- loveViews: Quan điểm tình yêu/tình dục
- experience: Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)
- nsfwPersonality: Tính cách khi ân ái/NSFW
- nsfwReactions: Phản ứng cơ thể đặc trưng khi NSFW
- literaryDescription: Chân dung văn học giàu cảm xúc theo kiểu SFW. BẮT BUỘC CÓ THÊM 1 ĐOẠN ĐỂ KỂ VỀ CÁC VẬT PHẨM, TÀI SẢN CỦA NPC.
- goal: Mục tiêu/khao khát hiện tại
- needs: Nhu cầu (gồm SFW và NSFW). AI đã được bổ sung kiến thức để tự động phân tích và tạo ra tối thiểu 2 nhu cầu đa dạng cho NPC dựa trên tính cách và bối cảnh như sau: Nhu cầu cơ bản/đời thường: Bao gồm các nhu cầu như ăn uống (do đói, thèm), đi chơi, giải trí, mua sắm. Nhu cầu tình cảm: Khát khao tình cảm gia đình, bạn bè, nam nữ/trai gái, cần sự quan tâm chở che hay thấu hiểu. Nhu cầu sinh tồn/quyền lực (tùy bối cảnh): Nhu cầu cần thức ăn, chỗ dựa vững chắc (trong thế giới mạt thế), hoặc nhu cầu thao túng, chiếm đoạt tài sản, kiểm soát người khác (trong bối cảnh tranh đấu, chính trị). Nhu cầu tình dục (NSFW): Từ việc chỉ đơn giản là muốn thỏa mãn sinh lý đến những khao khát/sở thích rất cụ thể trong tình dục. AI sẽ tự động lồng ghép và đề xuất ít nhất 2 nhu cầu (không có giới hạn tối đa) được miêu tả cẩn thận bằng văn học trong quá trình khởi tạo hoặc làm mới NPC.
- preferences:
  - sfw: Sở thích, ghét, nỗi sợ ở chế độ SFW.
  - nsfw: Sở thích, ghét, nỗi sợ ở chế độ NSFW.

Tôn trọng luật SHOW DON'T TELL.`;

    const existingNames = (gameData?.npcs || [])
      .map((n: any) => n.fullName || n.name)
      .join(", ");

    const worldContext = `
[THÔNG TIN THẾ GIỚI (CODEX)]:
- Tên thế giới: ${gameData?.worldData?.name || "Không rõ"}
- Mô tả: ${gameData?.worldData?.background || "Không rõ"}
- Cấp độ sức mạnh: ${gameData?.worldData?.powerSystem || "Không rõ"}
- Kỷ nguyên/Thời đại: ${gameData?.worldData?.starterTimeline || "Không rõ"}
- Đặc điểm bối cảnh: ${gameData?.worldData?.genre || "Không rõ"}
- Khác: ${gameData?.worldData?.uniqueElements || ""}
`;

    let finalPrompt = `[BẮT BUỘC]\nBạn phải sử dụng thẻ <THINKING_PROCESS> để bao bọc quá trình suy luận nội bộ theo trình tự 5 bước thiết yếu (Phân tích, Lên danh sách nhiệm vụ, Lên kế hoạch, Thực thi, Kiểm toán) dưới góc nhìn của Hội đồng chuyên gia trước khi đưa ra kết quả cuối cùng.\n\nSau khi kết thúc thẻ </THINKING_PROCESS>, bạn BẮT BUỘC phải trả về kết quả dưới định dạng JSON (bọc trong \`\`\`json ... \`\`\`) với duy nhất một thuộc tính gốc là "newNPCs" chứa danh sách các NPC được tạo. Cấu trúc JSON phải chính xác như sau (KHÔNG dùng định dạng OpenAPI Schema, mà phải trả về dữ liệu thực tế dạng Object JSON có mảng newNPCs):
\`\`\`json
{
  "newNPCs": [
    {
      "name": "Tên ngắn...",
      "fullName": "Tên đầy đủ...",
      "titles": "Danh xưng...",
      "occupation": "Nghề nghiệp...",
      "role": "Vai trò...",
      "background": "Cốt truyện...",
      "gender": "Giới tính...",
      "age": "Tuổi...",
      "dob": "Ngày sinh...",
      "rank": "Cấp bậc...",
      "height": "Chiều cao...",
      "weight": "Cân nặng...",
      "measurements": "Số đo...",
      "appearance": "Ngoại hình...",
      "appearanceLite": "Ngoại hình tóm tắt...",
      "powers": [{ "name": "Tên năng lực", "description": "Mô tả", "type": "Loại", "level": "Cấp độ" }],
      "skills": [{ "name": "Tên kỹ năng", "description": "Mô tả", "type": "Loại", "level": "Cấp độ" }],
      "personality": "Tính cách...",
      "personalityCore": "Cốt lõi tính cách...",
      "philosophy": "Triết lý sống...",
      "goal": "Mục tiêu...",
      "distinguishingFeatures": "Đặc điểm nhận dạng...",
      "innerSecret": "Bí mật thầm kín...",
      "relationships": [{ "name": "Họ và Tên", "relation": "Quan hệ", "status": "Trạng thái", "impression": "Ấn tượng và suy nghĩ chi tiết (BẮT BUỘC ĐIỀN ĐẦY ĐỦ)", "termsOfAddress": ["Cách xưng hô 1 (BẮT BUỘC)", "Cách xưng hô 2"], "selfAppellation": ["Cách tự xưng 1 (BẮT BUỘC)", "Cách tự xưng 2"], "description": "Mô tả" }],
      "loveViews": "Quan điểm tình yêu...",
      "experience": "Kinh nghiệm...",
      "nsfwPersonality": "Tính cách NSFW...",
      "nsfwReactions": "Phản ứng NSFW...",
      "literaryDescription": "Chân dung văn học...",
      "preferences": {
        "sfw": "Sở thích SFW...",
        "nsfw": "Sở thích NSFW..."
      },
      "avatarUrl": ""
    }
  ]
}
\`\`\`\n\n`;
    finalPrompt += `${worldContext}\n\nHãy phân tích hình ảnh (nếu có) và yêu cầu sau để tạo ra một hoặc nhiều NPC mới cho Game, ĐẢM BẢO KHÔNG TRÙNG LẶP VỚI CÁC NHÂN VẬT ĐÃ CÓ VÀ PHÙ HỢP LOGIC THẾ GIỚI MÀ NGƯỜI CHƠI ĐANG CHƠI (${existingNames}).\n\n`;
    finalPrompt += `YÊU CẦU: ${prompt}\n`;

    try {
      let fullJsonStr = "";
      let thinkingText = "";
      const stream = aiService.generateStreamingContent(
        finalPrompt,
        undefined,
        sysInstruction,
        images,
      );

      for await (const chunk of stream) {
        if (chunk.thought) {
          thinkingText += chunk.thought;
        }
        if (chunk.text) {
          fullJsonStr += chunk.text;
        }
        const displayStr =
          (thinkingText ? thinkingText + "\n\n" : "") + fullJsonStr;
        setStreamText(displayStr);
      }

      try {
        const parsedData = safeParseJSON(fullJsonStr);
        console.log("Parsed Data:", parsedData);

        let npcList = [];
        if (Array.isArray(parsedData)) {
          npcList = parsedData;
        } else if (parsedData.newNPCs && Array.isArray(parsedData.newNPCs)) {
          npcList = parsedData.newNPCs;
        } else if (parsedData.npcs && Array.isArray(parsedData.npcs)) {
          npcList = parsedData.npcs;
        } else if (parsedData.NPCs && Array.isArray(parsedData.NPCs)) {
          npcList = parsedData.NPCs;
        } else {
          const arrayKeys = Object.keys(parsedData).filter((k) =>
            Array.isArray(parsedData[k]),
          );
          if (arrayKeys.length > 0) {
            npcList = parsedData[arrayKeys[0]];
          }
        }

        if (npcList.length > 0) {
          setNpcBuilder({ generatedNPCs: npcList });
        } else {
          toast.error("AI không trả về dữ liệu danh sách NPC hợp lệ.");
        }
      } catch (parseError) {
        toast.error("Lỗi parse JSON từ AI.");
        console.error("Parse error string:", cleanedJsonStr);
      }
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsGenerating(false);
      if (timerIntervalId) clearInterval(timerIntervalId);
    }
  };

  const handleApplyNPCs = () => {
    if (generatedNPCs.length === 0) return;

    const npcsToAdd = generatedNPCs.map((npc) => ({
      id: "npc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      ...npc,
    }));

    setGameData((draft: any) => {
      if (draft) {
        return {
          ...draft,
          npcs: [...(draft.npcs || []), ...npcsToAdd],
        };
      }
      return draft;
    });

    setNpcBuilder({ generatedNPCs: [] });
    toast.success(`Đã thêm ${npcsToAdd.length} nhân vật mới vào game!`);
    onClose();
  };

  const handleApplySingleNPC = (npc: any, idx: number) => {
    const npcToAdd = {
      id: "npc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      ...npc,
    };

    setGameData((draft: any) => {
      if (draft) {
        return {
          ...draft,
          npcs: [...(draft.npcs || []), npcToAdd],
        };
      }
      return draft;
    });

    const remaining = [...generatedNPCs];
    remaining.splice(idx, 1);
    setNpcBuilder({ generatedNPCs: remaining });
    toast.success(`Đã tuyển ${npc.fullName || npc.name}!`);
  };

  const toggleExpandNode = (idx: number) => {
    setExpandedNPCs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex m-0 p-0 overflow-hidden text-sm"
      onClick={onClose}
    >
      <div
        className={`w-full h-full flex flex-col shadow-2xl transition-all duration-300 relative ${theme.group === "Dark" ? "theme-panel text-white" : "bg-[#FAF6F0] text-[#0f172a]"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-4 md:p-6 flex items-center justify-between border-b shrink-0 ${theme.group === "Dark" ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-lg border ${theme.group === "Dark" ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"} shadow-inner`}
            >
              <Wrench size={18} className={theme.textPrimary} />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm md:text-base font-bold tracking-widest uppercase">
                Nơi Tạo NPC Mới
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    modalScrollRef.current?.scrollTo({
                      top: 0,
                      behavior: "auto",
                    })
                  }
                  className={`p-1 rounded shadow-sm ${theme.group === "Dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/10 hover:bg-black/20 text-black"} transition-all`}
                  title="Lên đầu trang"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() =>
                    modalScrollRef.current?.scrollTo({
                      top: modalScrollRef.current.scrollHeight,
                      behavior: "auto",
                    })
                  }
                  className={`p-1 rounded shadow-sm ${theme.group === "Dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/10 hover:bg-black/20 text-black"} transition-all`}
                  title="Xuống cuối trang"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div
          ref={modalScrollRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-6xl mx-auto flex flex-col gap-6 custom-scrollbar pb-24"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2 opacity-80 uppercase tracking-widest">
                  Gợi Ý Của Bạn
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setNpcBuilder({ prompt: e.target.value })}
                  placeholder="Nhập mô tả về nhân vật (Ngoại hình, tính cách, bối cảnh)...&#10;Ví dụ: Một miêu nữ sát thủ tàn nhẫn nhưng thích được vuốt ve..."
                  className={`w-full h-32 md:h-40 p-4 rounded-xl outline-none transition-all resize-none ${theme.group === "Dark" ? "bg-black/40 text-white border border-white/10 focus:border-white/30" : "bg-white text-black border border-black/20 focus:border-black/50"}`}
                />
              </div>

              <div className="w-full md:w-1/3 flex flex-col">
                <label className="block text-sm font-semibold mb-2 opacity-80 uppercase tracking-widest">
                  Hình Ảnh (Mũi Chọn)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 min-h-[8rem] flex flex-col gap-2 items-center justify-center p-4 rounded-xl border border-dashed transition-all cursor-pointer ${theme.group === "Dark" ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-black/20 bg-black/5 hover:bg-black/10"}`}
                >
                  <ImagePlus size={32} className="opacity-50" />
                  <span className="text-sm opacity-60 font-medium tracking-wide">
                    Tải Lên (Tối đa 3)
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden shadow-lg border border-white/10 w-24 h-24 md:w-32 md:h-32"
                  >
                    <img
                      src={img}
                      alt="Tải lên"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={generateNPCs}
              disabled={isGenerating || (!prompt.trim() && images.length === 0)}
              className={`w-full mt-2 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                isGenerating
                  ? "opacity-50 cursor-not-allowed bg-black/20 border-white/10"
                  : theme.group === "Dark"
                    ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                    : "bg-black/10 hover:bg-black/20 border border-black/20 text-black"
              }`}
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {isGenerating
                ? "Hệ thống đang cấu trúc nhân vật..."
                : "Khởi Tạo NPC"}
            </button>

            <AnimatePresence>
              {(isGenerating || streamText) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 rounded-xl border overflow-hidden flex flex-col ${theme.group === "Dark" ? "bg-black border-white/10" : "bg-black/90 border-black/20"}`}
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                        AI Core Terminal
                      </span>
                      {isGenerating && (
                        <span className="text-xs font-mono text-green-400">
                          {Math.floor(elapsedTime / 60)
                            .toString()
                            .padStart(2, "0")}
                          :{(elapsedTime % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsStreamExpanded(!isStreamExpanded)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      {isStreamExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                  <div
                    className={`p-4 font-mono text-xs overflow-y-auto leading-relaxed whitespace-pre-wrap transition-all ${isStreamExpanded ? "h-96" : "h-32"} text-green-500/80`}
                  >
                    {streamText || "Khởi động giao thức kết nối..."}
                    {isGenerating && <span className="animate-pulse">_</span>}
                    <div ref={streamEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {(isGenerating || generatedNPCs.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex flex-col gap-4 p-4 md:p-6 rounded-xl border ${theme.group === "Dark" ? "bg-black/40 border-white/10" : "bg-white border-black/20"}`}
              >
                <div className="flex items-center justify-between border-b pb-3 mb-2 border-white/10">
                  <h3 className="font-bold uppercase tracking-widest flex items-center gap-2">
                    {isGenerating ? "Dữ Liệu Đang Đồng Bộ..." : "Hồ Sơ NPC Mới"}
                  </h3>
                  {generatedNPCs.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded font-mono border border-green-500/30">
                      {generatedNPCs.length} NPCs Sẵn Sàng
                    </span>
                  )}
                </div>

                {isGenerating && !generatedNPCs.length && (
                  <div className="flex flex-col items-center justify-center p-8 gap-4 opacity-70">
                    <Loader2
                      size={48}
                      className="animate-spin text-[var(--accent)]"
                    />
                    <p className="font-mono text-sm tracking-widest uppercase text-center mt-2">
                      Hệ thống Lõi AI đang được kích hoạt...
                      <br />
                      Đang liên kết dữ liệu vũ trụ để dệt nên sinh mệnh mới, cấu
                      trúc thân thể, tính cách và dị năng...
                    </p>
                  </div>
                )}

                {generatedNPCs.length > 0 && (
                  <div className="flex flex-col gap-6 w-full">
                    {generatedNPCs.map((npc, idx) => {
                      const labelClass =
                        theme.group === "Dark"
                          ? "text-cyan-400"
                          : "text-cyan-700";
                      return (
                        <div
                          key={idx}
                          className={`p-4 md:p-6 rounded-xl border shadow-inner ${theme.group === "Dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
                        >
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5 dark-theme:border-white/5">
                            <div>
                              <h4 className="text-xl md:text-2xl font-bold uppercase tracking-wide">
                                {npc.fullName || npc.name}
                              </h4>
                              <p className="text-sm opacity-60">
                                {npc.titles} • {npc.role}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleExpandNode(idx)}
                                className="p-2 rounded hover:bg-black/10 dark-theme:hover:bg-white/10 transition-colors text-slate-500"
                              >
                                {expandedNPCs[idx] ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                              <button
                                onClick={() => handleApplySingleNPC(npc, idx)}
                                className="px-4 py-2 rounded bg-green-500/20 hover:bg-green-500/30 text-green-600 dark-theme:text-green-400 font-bold uppercase tracking-widest text-xs transition-colors"
                              >
                                Tuyển
                              </button>
                            </div>
                          </div>

                          {expandedNPCs[idx] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm mt-4">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-semibold uppercase tracking-widest text-blue-500 text-xs mb-1">
                                    Cơ Bản
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2 bg-black/5 dark-theme:bg-white/5 p-3 rounded-lg border border-black/5 dark-theme:border-white/5">
                                    <p>
                                      <strong className={labelClass}>
                                        Nghề:
                                      </strong>{" "}
                                      {npc.occupation}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Cấp bậc:
                                      </strong>{" "}
                                      {npc.rank}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Giới tính:
                                      </strong>{" "}
                                      {npc.gender}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Tuổi:
                                      </strong>{" "}
                                      {npc.age}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Ngày sinh:
                                      </strong>{" "}
                                      {npc.dob}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Chiều cao:
                                      </strong>{" "}
                                      {npc.height}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Cân nặng:
                                      </strong>{" "}
                                      {npc.weight}
                                    </p>
                                    <p className="col-span-2">
                                      <strong className={labelClass}>
                                        Cơ thể:
                                      </strong>{" "}
                                      {npc.measurements}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-semibold uppercase tracking-widest text-purple-500 text-xs mb-1">
                                    Ngoại Hình & Lai Lịch
                                  </h5>
                                  <div className="space-y-2 opacity-80 text-justify leading-relaxed">
                                    <ExpandableText
                                      label="Biểu hiện"
                                      text={npc.appearance}
                                      theme={theme}
                                    />
                                    <p>
                                      <strong className={labelClass}>
                                        Tóm tắt ngoại hình:
                                      </strong>{" "}
                                      {npc.appearanceLite}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Đặc điểm nhận dạng:
                                      </strong>{" "}
                                      {npc.distinguishingFeatures}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Lai lịch:
                                      </strong>{" "}
                                      {npc.background}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-semibold uppercase tracking-widest text-red-500 text-xs mb-1">
                                    Nội Tâm
                                  </h5>
                                  <div className="space-y-2 bg-black/5 dark-theme:bg-white/5 p-3 rounded-lg border border-black/5 dark-theme:border-white/5 leading-relaxed">
                                    <p>
                                      <strong className={labelClass}>
                                        Tính cách hiển lộ:
                                      </strong>{" "}
                                      {npc.personality}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Cốt lõi tính cách:
                                      </strong>{" "}
                                      {npc.personalityCore}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Triết lý:
                                      </strong>{" "}
                                      {npc.philosophy}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Bí mật:
                                      </strong>{" "}
                                      {npc.innerSecret}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Mục tiêu:
                                      </strong>{" "}
                                      {npc.goal}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-semibold uppercase tracking-widest text-pink-500 text-xs mb-1">
                                    Thông Tin Mở Rộng
                                  </h5>
                                  <div className="space-y-2 bg-black/5 dark-theme:bg-white/5 p-3 rounded-lg border border-black/5 dark-theme:border-white/5 leading-relaxed">
                                    <p>
                                      <strong className={labelClass}>
                                        Quan điểm tình yêu:
                                      </strong>{" "}
                                      {npc.loveViews}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Kinh nghiệm tình trường:
                                      </strong>{" "}
                                      {npc.experience}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Tính cách NSFW:
                                      </strong>{" "}
                                      {npc.nsfwPersonality}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Phản ứng cơ thể NSFW:
                                      </strong>{" "}
                                      {npc.nsfwReactions}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Sở thích, ghét, sợ (SFW):
                                      </strong>{" "}
                                      {npc.preferences?.sfw}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Sở thích, ghét, sợ (NSFW):
                                      </strong>{" "}
                                      {npc.preferences?.nsfw}
                                    </p>
                                    <p>
                                      <strong className={labelClass}>
                                        Chân dung văn học:
                                      </strong>{" "}
                                      {npc.literaryDescription}
                                    </p>
                                  </div>
                                </div>

                                {Array.isArray(npc.powers) &&
                                  npc.powers.filter(
                                    (p: any) => p.name || p.description,
                                  ).length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-black/5 dark-theme:border-white/5">
                                      <p className="text-yellow-500 font-semibold uppercase tracking-widest text-xs">
                                        Sức mạnh / Phép thuật:
                                      </p>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {npc.powers
                                          .filter(
                                            (p: any) => p.name || p.description,
                                          )
                                          .map((p: any, i: number) => (
                                            <li key={i}>
                                              {p.name && (
                                                <strong className="text-yellow-600 dark-theme:text-yellow-400">
                                                  {p.name}
                                                </strong>
                                              )}
                                              {p.level
                                                ? ` (Cấp: ${p.level})`
                                                : ""}
                                              {(p.name || p.level) &&
                                              p.description
                                                ? ": "
                                                : ""}
                                              {p.description}
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}

                                {Array.isArray(npc.skills) &&
                                  npc.skills.filter(
                                    (s: any) => s.name || s.description,
                                  ).length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-black/5 dark-theme:border-white/5">
                                      <p className="text-emerald-500 font-semibold uppercase tracking-widest text-xs">
                                        Kỹ năng:
                                      </p>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {npc.skills
                                          .filter(
                                            (s: any) => s.name || s.description,
                                          )
                                          .map((s: any, i: number) => (
                                            <li key={i}>
                                              {s.name && (
                                                <strong className="text-emerald-600 dark-theme:text-emerald-400">
                                                  {s.name}
                                                </strong>
                                              )}
                                              {s.level
                                                ? ` (Cấp: ${s.level})`
                                                : ""}
                                              {(s.name || s.level) &&
                                              s.description
                                                ? ": "
                                                : ""}
                                              {s.description}
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}

                                {Array.isArray(npc.relationships) &&
                                  npc.relationships.filter(
                                    (r: any) => r.name || r.description,
                                  ).length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-black/5 dark-theme:border-white/5">
                                      <p className="text-orange-500 font-semibold uppercase tracking-widest text-xs">
                                        Mối quan hệ:
                                      </p>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {npc.relationships
                                          .filter(
                                            (r: any) => r.name || r.description,
                                          )
                                          .map((r: any, i: number) => (
                                            <li key={i}>
                                              {r.name && (
                                                <strong className="text-orange-600 dark-theme:text-orange-400">
                                                  {r.name}
                                                </strong>
                                              )}
                                              {r.relation
                                                ? ` - ${r.relation}`
                                                : ""}
                                              {r.status ? ` (${r.status})` : ""}
                                              {(r.name ||
                                                r.relation ||
                                                r.status) &&
                                              r.description
                                                ? ": "
                                                : ""}
                                              {r.description}
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={handleApplyNPCs}
                      className="w-full mt-4 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-green-500/20 hover:bg-green-500/30 text-green-600 dark-theme:text-green-400 border border-green-500/30"
                    >
                      <UserPlus size={18} />
                      Đưa {generatedNPCs.length} NPC Này Vào Lịch Sử Game
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
