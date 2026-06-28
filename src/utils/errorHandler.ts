export function cleanErrorMessage(msg: string): string {
  if (!msg) return "";
  const lower = msg.toLowerCase();
  
  if (lower.includes("safety") || lower.includes("finishreason: safety") || lower.includes("content gets blocked") || lower.includes("block_reason")) {
    return "Nội dung sinh ra bị hệ thống (Google Safety) đánh dấu là không an toàn (bạo lực, tình dục, thù hận, v.v.). Vui lòng thay đổi hành động/câu lệnh nhẹ nhàng hơn hoặc chỉnh bộ lọc an toàn.";
  }

  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota exceeded") ||
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("exhausted")
  ) {
    return "Hạn ngạch API hoặc tài nguyên hệ thống (Quota) bị cạn kiệt! Bạn hãy đổi cấu hình sang dùng dòng Flash (hoặc Flash-Lite) trong Cài đặt hoặc chờ vài phút rồi thử lại.";
  }
  
  if (lower.includes("api key") || lower.includes("api_key") || lower.includes("key not found") || lower.includes("unauthorized") || lower.includes("403") || lower.includes("401")) {
    return "API Key của bạn không hợp lệ hoặc thiếu quyền hạn truy cập (401/403). Vui lòng mở Cài đặt (Settings) -> tab Chung để kiểm tra lại và đảm bảo không có khoảng trắng bị dư.";
  }

  // Rút gọn các lỗi chứa stack trace hoặc JSON rườm rà
  if (msg.includes("throwErrorIfNotOK") || msg.includes("ApiError:") || msg.includes("node_modules") || msg.includes("{\n")) {
    return "Lỗi kết nối hoặc xử lý nội bộ phía máy chủ AI. Dữ liệu hồi đáp bị bất định, bạn hãy chờ ít giây rồi thử lại tải (F5).";
  }
  
  return msg;
}

export function formatErrorMessage(error: any): { type: string; message: string; solution: string; code?: string } {
  // If it's a specific object error, try to extract its internal message
  const rawMsg = error?.message || error?.statusText || String(error);
  const cleanedMsg = cleanErrorMessage(rawMsg);
  const errStr = rawMsg.toLowerCase();
  
  // Extract error code (3-digit HTTP status code) or inner code
  const errorCodeMatch = rawMsg.match(/\b(40[0-9]|4[1-9][0-9]|50[0-9]|5[1-9][0-9])\b/);
  const foundCode = errorCodeMatch ? errorCodeMatch[1] : error?.status ? String(error.status) : "";
  const errorCodeStr = foundCode ? ` [Code: ${foundCode}]` : "";

  if (errStr.includes("safety") || errStr.includes("block_reason") || errStr.includes("finishreason: safety")) {
    return {
      type: `Lỗi Cảnh Cáo An Toàn (Safety Filter)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- Văn cảnh hiện tại chứa nhiều yếu tố nhạy cảm (NSFW, bạo lực kịch liệt, ...).\n- Hãy thử diễn đạt lời nói giảm nhẹ hơn, tránh từ ngữ trực tiếp bị Google cấm.\n- Kiểm tra thiết lập màng lọc an toàn API nếu có mã code riêng."
    };
  }

  if (errStr.includes("fetch") || errStr.includes("network") || errStr.includes("internet") || errStr.includes("failed to fetch")) {
    return {
      type: `Lỗi Mạng (Network/Internet)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- Kiểm tra mạng máy tính (Wifi/LAN) hoặc tường lửa trình duyệt đang chặn.\n- Extension dạng Ad-blocker đôi lúc chặn kết nối ra ngoài, hãy tạm tắt chặn quảng cáo.\n- Nhấn F5 tải lại tab."
    };
  }
  if (errStr.includes("api key") || errStr.includes("401") || errStr.includes("unauthorized") || errStr.includes("forbidden") || errStr.includes("403") || errStr.includes("permission_denied")) {
    return {
      type: `Lỗi Xác Nhận Quyền (API Key/Token)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- API Key có thể đã bị khóa/xóa hoặc nhập sai, dư khoảng trắng.\n- Vào 'Cấu Hình' (Settings) kiểm tra, dán lại API Key chuẩn của bạn từ Google AI Studio."
    };
  }
  if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("rate limit") || errStr.includes("too many") || errStr.includes("exhausted") || errStr.includes("resource_exhausted")) {
    return {
      type: `Lỗi Giới Hạn Lưu Lượng (Quota/Overloaded)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- Model bạn dùng đang cạn lượt miễn phí. Nên chuyển xuống dùng model nhẹ hơn (Flash/Flash 8b).\n- Hệ thống đang dồn ứ yêu cầu. Chờ 30 giây rùi hẵng thao tác tiếp."
    };
  }
  if (errStr.includes("proxy") || errStr.includes("502") || errStr.includes("504") || errStr.includes("gateway") || errStr.includes("503") || errStr.includes("500") || errStr.includes("timeout") || errStr.includes("internal_error")) {
    return {
      type: `Lỗi Server Trả Về (Internal Provider Error)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- Lỗi từ cụm máy chủ trung tâm của AI (Backend sập hoặc quá tải tạm thời).\n- Bạn chẳng làm gì sai cả, chỉ cần F5 hoặc ngồi chờ 1 lúc là xong."
    };
  }
  if (errStr.includes("cors")) {
    return {
      type: `Lỗi Bảo Mật Trình Duyệt (CORS)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- Dùng tab ẩn danh (Incognito) hoặc tắt Brave Shields / Ublock Origin đang chặn request API."
    };
  }
  if (errStr.includes("json") || errStr.includes("parse") || errStr.includes("end of json") || errStr.includes("expected ','")) {
    return {
      type: `Lỗi Giải Mã JSON (Parsing)${errorCodeStr}`,
      message: cleanedMsg,
      solution: "- AI tạo ra định dạng câu chữ bị nát, thiếu móc ngoặc nên hệ thống không đọc được.\n- Thử nhấn tạo tiếp (Retry) để AI suy nghĩ logic tạo lại cấu trúc mới nguyên vẹn."
    };
  }
  
  return {
    type: `Lỗi Hệ Thống Lạ (Unknown Exception)${errorCodeStr}`,
    message: cleanedMsg,
    solution: "- Có lỗi ngầm định lạ nào đó chưa rõ, chụp màn hình gửi Dev fix giùm nha.\n- Nhanh nhất là F5 trình duyệt để reset luồng."
  };
}

export function generateSysLog(error: any): string {
  const formatted = formatErrorMessage(error);
  const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  return `[${timeStr}] 🔴 LOẠI LỖI: ${formatted.type}\n📌 MÔ TẢ: ${formatted.message}\n💡 CÁCH KHẮC PHỤC: \n${formatted.solution}\n----------------------------------------\n`;
}

export function normalizeUsage(u: any) {
  if (!u) return { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
  
  const promptTokenCount = u.promptTokenCount ?? u.prompt_tokens ?? u.inputTokenCount ?? 0;
  const candidatesTokenCount = u.candidatesTokenCount ?? u.completion_tokens ?? u.outputTokenCount ?? 0;
  const totalTokenCount = u.totalTokenCount ?? u.total_tokens ?? u.totalTokenCount ?? (promptTokenCount + candidatesTokenCount);
  
  return {
    promptTokenCount,
    candidatesTokenCount,
    totalTokenCount
  };
}
