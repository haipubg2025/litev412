const fs = require('fs');

const rawText = `{
  "worldTime": "Day 1",
  "npcUpdates": [
    {
      "id": "Alica",
      "updates": {
        "appearance": "New Alica Appearance",
        "relationships": [
          { "name": "MC", "relation": "Husband" }
        ]
      }
    }
  ]
}`;

// Mock dependencies
const gameData = {
  npcs: [
    { id: "Alica", name: "Alica", appearance: "Old Alica", relationships: [] }
  ]
};

let newData = JSON.parse(JSON.stringify(gameData));
let parsedData = JSON.parse(rawText);

if (parsedData.npcUpdates && Array.isArray(parsedData.npcUpdates)) {
  parsedData.npcUpdates.forEach((upd) => {
    if (upd.id && upd.updates && typeof upd.updates === "object") {
      const cNpc = { ...upd.updates };
      delete cNpc.ghi_chu_quan_trong;
      delete cNpc.LƯU_Ý_KHI_XUẤT_JSON;
      delete cNpc["TÊN_TRƯỜNG_ĐÃ_TỒN_TẠI"];

      const idx = (newData.npcs || []).findIndex(
        (n) => n.name === upd.id || (n.name && upd.id.includes(n.name))
      );
      if (idx !== -1) {
        const smartMergeArray = (oldArr, newArr) => {
          if (!Array.isArray(oldArr)) oldArr = [];
          if (!Array.isArray(newArr)) return oldArr;
          
          let merged = [...oldArr];
          newArr.forEach(newItem => {
            if (!newItem.name) return;
            const idx = merged.findIndex(i => i.name === newItem.name);
            if (idx !== -1) {
              merged[idx] = { ...merged[idx], ...newItem }; // Cập nhật
            } else {
              merged.push(newItem); // Thêm mới
            }
          });
          return merged;
        };

        const arrayKeys = ['powers', 'skills', 'relationships'];
        arrayKeys.forEach(key => {
          if (cNpc[key] && Array.isArray(cNpc[key])) {
            cNpc[key] = smartMergeArray(newData.npcs[idx][key] || [], cNpc[key]);
          }
        });

        if (!newData.npcs[idx].pendingUpdates) {
          newData.npcs[idx].pendingUpdates = {};
        }
        newData.npcs[idx].pendingUpdates = {
          ...newData.npcs[idx].pendingUpdates,
          ...cNpc
        };
      }
    }
  });
}

console.log(JSON.stringify(newData.npcs, null, 2));
