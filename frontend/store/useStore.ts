import { create } from 'zustand';
import { calculateNextReviewDate, formatDateISO } from '@/utils/dateUtils';
// import { scheduleReviewNotification } from '@/utils/notificationUtils';

// Types
export interface Problem {
  id: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface ReviewHistory {
  date: string; // YYYY-MM-DD format
  score: number;
  correctCount: number;
  totalCount: number;
}

export interface Material {
  id: string;
  folderId: string;
  title: string;
  summary: string;
  problems: Problem[];
  reviewCount: number;
  averageScore: number;
  createdAt: string; // YYYY.MM.DD format
  lastReview: string | null; // YYYY.MM.DD format
  nextReview: string | null; // YYYY-MM-DD format for comparison
  reviewHistory: ReviewHistory[];
  // Problem settings
  problemSettings: {
    multipleChoice: number;
    trueFalse: number;
  };
}

export interface Folder {
  id: string;
  name: string;
  materialCount: number;
}

// ⭐ 로그인 유저 타입 추가
export interface User {
  id: number;
  email: string;
}

interface StoreState {
  // ⭐ 현재 로그인한 사용자
  user: User | null;
  setUser: (user: User | null) => void;

  folders: Folder[];
  materials: Material[];

  // Folder actions
  addFolder: (name: string) => string; // Returns the new folder ID
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  // Material actions
  addMaterial: (material: Omit<Material, 'id' | 'reviewCount' | 'averageScore' | 'reviewHistory' | 'lastReview' | 'nextReview'>) => void;
  renameMaterial: (id: string, title: string) => void;
  deleteMaterial: (id: string) => void;
  updateMaterialSettings: (id: string, settings: { multipleChoice: number; trueFalse: number }) => void;

  // Problem actions
  deleteProblem: (materialId: string, problemId: string) => void;

  // Quiz actions
  completeQuiz: (materialId: string, results: (Problem & { userAnswer: string | null; userAnsweredCorrectly: boolean })[]) => void;
}

/**
 * =============================================================================
 * [백엔드 연결 필요] Zustand Store
 * =============================================================================
 */

export const useStore = create<StoreState>((set) => ({
  // ⭐ 처음에는 로그인 유저 없음
  user: null,

  // ⭐ 로그인 / 로그아웃 시 사용할 액션
  setUser: (user) => set({ user }),

  // Initial mock data
  folders: [
    { id: 'f1', name: '데이터베이스', materialCount: 2 },
    { id: 'f2', name: '페스트의 역사', materialCount: 1 },
    { id: 'f3', name: '인공지능', materialCount: 0 },
  ],

  materials: [
    {
      id: 'm1',
      folderId: 'f1',
      title: '데이터베이스의 개념',
      summary: `데이터베이스는 구조화된 정보의 조직화된 모음입니다. 데이터베이스 관리 시스템(DBMS)은 데이터베이스와 상호작용하기 위한 소프트웨어입니다.

주요 개념:
• 데이터의 효율적인 저장 및 검색
• 데이터 무결성 유지
• 여러 사용자의 동시 접근 관리
• 데이터 보안 및 백업

데이터베이스는 현대 애플리케이션의 핵심 구성 요소이며, 웹 서비스부터 모바일 앱까지 모든 곳에서 사용됩니다.`,
      problems: [],
      reviewCount: 3,
      averageScore: 85,
      createdAt: '2024.11.10',
      lastReview: '2024.11.17',
      nextReview: '2025-11-19', // Today
      reviewHistory: [
        { date: '2024-11-11', score: 80, correctCount: 12, totalCount: 15 },
        { date: '2024-11-14', score: 86, correctCount: 13, totalCount: 15 },
        { date: '2024-11-17', score: 90, correctCount: 14, totalCount: 15 },
      ],
      problemSettings: { multipleChoice: 8, trueFalse: 7 },
    },
    {
      id: 'm2',
      folderId: 'f2',
      title: '페스트의 역사',
      summary: `페스트는 14세기 유럽을 강타한 전염병으로, 흑사병으로도 알려져 있습니다.

주요 내용:
• 1347-1353년 유럽 전역에 확산
• 유럽 인구의 약 1/3이 사망
• 사회, 경제, 문화에 큰 영향
• 의학 발전의 계기가 됨`,
      problems: [],
      reviewCount: 1,
      averageScore: 90,
      createdAt: '2024.11.15',
      lastReview: '2024.11.16',
      nextReview: '2025-11-18', // Yesterday (overdue)
      reviewHistory: [
        { date: '2024-11-16', score: 90, correctCount: 9, totalCount: 10 },
      ],
      problemSettings: { multipleChoice: 8, trueFalse: 7 },
    },
  ],

  // Folder actions
  addFolder: (name) => {
    const newFolderId = `f${Date.now()}`;
    set((state) => {
      const newFolder: Folder = {
        id: newFolderId,
        name,
        materialCount: 0,
      };
      return { folders: [...state.folders, newFolder] };
    });
    return newFolderId;
  },

  renameFolder: (id, name) =>
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, name } : folder
      ),
    })),

  deleteFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      materials: state.materials.filter((material) => material.folderId !== id),
    })),

  // Material actions
  addMaterial: (material) => {
    const materialId = `m${Date.now()}`;
    const nextReviewDate = calculateNextReviewDate(0);
    const nextReviewISO = formatDateISO(nextReviewDate);

    set((state) => {
      const newMaterial: Material = {
        ...material,
        id: materialId,
        reviewCount: 0,
        averageScore: 0,
        reviewHistory: [],
        lastReview: null,
        nextReview: nextReviewISO,
        problemSettings:
          material.problemSettings || { multipleChoice: 8, trueFalse: 7 },
        problems: [],
      };

      const updatedFolders = state.folders.map((folder) =>
        folder.id === material.folderId
          ? { ...folder, materialCount: folder.materialCount + 1 }
          : folder
      );

      return {
        materials: [...state.materials, newMaterial],
        folders: updatedFolders,
      };
    });
  },

  renameMaterial: (id, title) =>
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === id ? { ...material, title } : material
      ),
    })),

  deleteMaterial: (id) =>
    set((state) => {
      const material = state.materials.find((m) => m.id === id);
      if (!material) return state;

      const updatedFolders = state.folders.map((folder) =>
        folder.id === material.folderId
          ? {
              ...folder,
              materialCount: Math.max(0, folder.materialCount - 1),
            }
          : folder
      );

      return {
        materials: state.materials.filter((m) => m.id !== id),
        folders: updatedFolders,
      };
    }),

  updateMaterialSettings: (id, settings) =>
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === id
          ? { ...material, problemSettings: settings }
          : material
      ),
    })),

  deleteProblem: (materialId, problemId) =>
    set((state) => ({
      materials: state.materials.map((material) =>
        material.id === materialId
          ? {
              ...material,
              problems: material.problems.filter((p) => p.id !== problemId),
            }
          : material
      ),
    })),

  completeQuiz: (materialId, results) =>
    set((state) => {
      const material = state.materials.find((m) => m.id === materialId);
      if (!material) return state;

      const correctCount = results.filter(
        (r) => r.userAnsweredCorrectly
      ).length;
      const totalCount = results.length;
      const score = Math.round((correctCount / totalCount) * 100);

      const newIncorrectProblems: Problem[] = results
        .filter((r) => !r.userAnsweredCorrectly)
        .map(
          (r) =>
            ({
              id: r.id || `p${Date.now()}_${Math.random()}`,
              type: r.type,
              question: r.question,
              options: r.options,
              correctAnswer: r.correctAnswer,
            } as Problem)
        );

      const allIncorrectProblems = [...material.problems, ...newIncorrectProblems];

      const newReviewCount = material.reviewCount + 1;
      const newAverageScore = Math.round(
        (material.averageScore * material.reviewCount + score) /
          newReviewCount
      );

      const today = new Date();
      const newReviewHistory: ReviewHistory = {
        date: formatDateISO(today),
        score,
        correctCount,
        totalCount,
      };

      const nextReviewDate = calculateNextReviewDate(newReviewCount);
      const nextReviewISO = formatDateISO(nextReviewDate);

      const updatedMaterials = state.materials.map((m) =>
        m.id === materialId
          ? {
              ...m,
              problems: allIncorrectProblems,
              lastReview: formatDateISO(today).replace(/-/g, '.'),
              nextReview: nextReviewISO,
              reviewCount: newReviewCount,
              averageScore: newAverageScore,
              reviewHistory: [...m.reviewHistory, newReviewHistory],
            }
          : m
      );

      return { materials: updatedMaterials };
    }),
}));




// import { create } from 'zustand';
// import { calculateNextReviewDate, formatDateISO } from '@/utils/dateUtils';
// // import { scheduleReviewNotification } from '@/utils/notificationUtils';

// // Types
// export interface Problem {
//   id: string;
//   type: 'multiple_choice' | 'true_false';
//   question: string;
//   options?: string[];
//   correctAnswer: string;
// }

// export interface ReviewHistory {
//   date: string; // YYYY-MM-DD format
//   score: number;
//   correctCount: number;
//   totalCount: number;
// }

// export interface Material {
//   id: string;
//   folderId: string;
//   title: string;
//   summary: string;
//   problems: Problem[];
//   reviewCount: number;
//   averageScore: number;
//   createdAt: string; // YYYY.MM.DD format
//   lastReview: string | null; // YYYY.MM.DD format
//   nextReview: string | null; // YYYY-MM-DD format for comparison
//   reviewHistory: ReviewHistory[];
//   // Problem settings
//   problemSettings: {
//     multipleChoice: number;
//     trueFalse: number;
//   };
// }

// export interface Folder {
//   id: string;
//   name: string;
//   materialCount: number;
// }

// interface StoreState {
//   folders: Folder[];
//   materials: Material[];

//   // Folder actions
//   addFolder: (name: string) => string; // Returns the new folder ID
//   renameFolder: (id: string, name: string) => void;
//   deleteFolder: (id: string) => void;

//   // Material actions
//   addMaterial: (material: Omit<Material, 'id' | 'reviewCount' | 'averageScore' | 'reviewHistory' | 'lastReview' | 'nextReview'>) => void;
//   renameMaterial: (id: string, title: string) => void;
//   deleteMaterial: (id: string) => void;
//   updateMaterialSettings: (id: string, settings: { multipleChoice: number; trueFalse: number }) => void;

//   // Problem actions
//   deleteProblem: (materialId: string, problemId: string) => void;

//   // Quiz actions
//   completeQuiz: (materialId: string, results: (Problem & { userAnswer: string | null; userAnsweredCorrectly: boolean })[]) => void;
// }

// /**
//  * =============================================================================
//  * [백엔드 연결 필요] Zustand Store
//  * =============================================================================
//  *
//  * 현재 상태: 프론트엔드 메모리에만 저장 (앱 재시작 시 데이터 손실)
//  *
//  * 백엔드 연결 시:
//  * 1. 각 action에서 API 호출 추가
//  * 2. AsyncStorage 또는 백엔드 응답으로 초기 상태 로드
//  * 3. Optimistic update 패턴 적용
//  *
//  * API Endpoints:
//  * - GET /api/folders - 폴더 목록 조회
//  * - POST /api/folders - 폴더 생성
//  * - PUT /api/folders/:id - 폴더 수정
//  * - DELETE /api/folders/:id - 폴더 삭제
//  *
//  * - GET /api/materials - 자료 목록 조회
//  * - POST /api/materials - 자료 생성
//  * - PUT /api/materials/:id - 자료 수정
//  * - DELETE /api/materials/:id - 자료 삭제
//  * - POST /api/materials/:id/review - 퀴즈 결과 저장
//  * =============================================================================
//  */

// export const useStore = create<StoreState>((set) => ({
//   // Initial mock data
//   folders: [
//     { id: 'f1', name: '데이터베이스', materialCount: 2 },
//     { id: 'f2', name: '페스트의 역사', materialCount: 1 },
//     { id: 'f3', name: '인공지능', materialCount: 0 },
//   ],

//   materials: [
//     {
//       id: 'm1',
//       folderId: 'f1',
//       title: '데이터베이스의 개념',
//       summary: `데이터베이스는 구조화된 정보의 조직화된 모음입니다. 데이터베이스 관리 시스템(DBMS)은 데이터베이스와 상호작용하기 위한 소프트웨어입니다.

// 주요 개념:
// • 데이터의 효율적인 저장 및 검색
// • 데이터 무결성 유지
// • 여러 사용자의 동시 접근 관리
// • 데이터 보안 및 백업

// 데이터베이스는 현대 애플리케이션의 핵심 구성 요소이며, 웹 서비스부터 모바일 앱까지 모든 곳에서 사용됩니다.`,
//       problems: [],
//       reviewCount: 3,
//       averageScore: 85,
//       createdAt: '2024.11.10',
//       lastReview: '2024.11.17',
//       nextReview: '2025-11-19', // Today
//       reviewHistory: [
//         { date: '2024-11-11', score: 80, correctCount: 12, totalCount: 15 },
//         { date: '2024-11-14', score: 86, correctCount: 13, totalCount: 15 },
//         { date: '2024-11-17', score: 90, correctCount: 14, totalCount: 15 },
//       ],
//       problemSettings: { multipleChoice: 8, trueFalse: 7 },
//     },
//     {
//       id: 'm2',
//       folderId: 'f2',
//       title: '페스트의 역사',
//       summary: `페스트는 14세기 유럽을 강타한 전염병으로, 흑사병으로도 알려져 있습니다.

// 주요 내용:
// • 1347-1353년 유럽 전역에 확산
// • 유럽 인구의 약 1/3이 사망
// • 사회, 경제, 문화에 큰 영향
// • 의학 발전의 계기가 됨`,
//       problems: [],
//       reviewCount: 1,
//       averageScore: 90,
//       createdAt: '2024.11.15',
//       lastReview: '2024.11.16',
//       nextReview: '2025-11-18', // Yesterday (overdue)
//       reviewHistory: [
//         { date: '2024-11-16', score: 90, correctCount: 9, totalCount: 10 },
//       ],
//       problemSettings: { multipleChoice: 8, trueFalse: 7 },
//     },
//   ],

//   /**
//    * [백엔드 연결 필요] 폴더 추가
//    * API: POST /api/folders
//    * Request: { name: string }
//    * Response: { id: string, name: string, materialCount: number }
//    */
//   addFolder: (name) => {
//     const newFolderId = `f${Date.now()}`;
//     set((state) => {
//       const newFolder: Folder = {
//         id: newFolderId,
//         name,
//         materialCount: 0,
//       };
//       return { folders: [...state.folders, newFolder] };
//     });
//     return newFolderId;
//   },

//   /**
//    * [백엔드 연결 필요] 폴더 이름 수정
//    * API: PUT /api/folders/:id
//    * Request: { name: string }
//    * Response: { id: string, name: string }
//    */
//   renameFolder: (id, name) => set((state) => ({
//     folders: state.folders.map((folder) =>
//       folder.id === id ? { ...folder, name } : folder
//     ),
//   })),

//   /**
//    * [백엔드 연결 필요] 폴더 삭제
//    * API: DELETE /api/folders/:id
//    * Response: { success: boolean }
//    */
//   deleteFolder: (id) => set((state) => ({
//     folders: state.folders.filter((folder) => folder.id !== id),
//     materials: state.materials.filter((material) => material.folderId !== id),
//   })),

//   /**
//    * [백엔드 연결 필요] 자료 추가
//    * API: POST /api/materials
//    * Request: { folderId, title, summary, content }
//    * Response: Material object
//    */
//   addMaterial: (material) => {
//     const materialId = `m${Date.now()}`;
//     const nextReviewDate = calculateNextReviewDate(0);
//     const nextReviewISO = formatDateISO(nextReviewDate);

//     set((state) => {
//       const newMaterial: Material = {
//         ...material,
//         id: materialId,
//         reviewCount: 0,
//         averageScore: 0,
//         reviewHistory: [],
//         lastReview: null,
//         nextReview: nextReviewISO,
//         problemSettings: material.problemSettings || { multipleChoice: 8, trueFalse: 7 },
//         problems: [],
//       };

//       // 주석
//       // // Schedule notification for first review
//       // scheduleReviewNotification(material.title, materialId, nextReviewISO)
//       //   .then((notificationId) => {
//       //     if (notificationId) {
//       //       console.log(`Scheduled initial review notification for ${material.title}`);
//       //     }
//       //   })
//       //   .catch((error) => {
//       //     console.error('Failed to schedule notification:', error);
//       //   });

//       // Update folder material count
//       const updatedFolders = state.folders.map((folder) =>
//         folder.id === material.folderId
//           ? { ...folder, materialCount: folder.materialCount + 1 }
//           : folder
//       );

//       return {
//         materials: [...state.materials, newMaterial],
//         folders: updatedFolders,
//       };
//     });
//   },

//   /**
//    * [백엔드 연결 필요] 자료 이름 수정
//    * API: PUT /api/materials/:id
//    * Request: { title: string }
//    */
//   renameMaterial: (id, title) => set((state) => ({
//     materials: state.materials.map((material) =>
//       material.id === id ? { ...material, title } : material
//     ),
//   })),

//   /**
//    * [백엔드 연결 필요] 자료 삭제
//    * API: DELETE /api/materials/:id
//    */
//   deleteMaterial: (id) => set((state) => {
//     const material = state.materials.find((m) => m.id === id);
//     if (!material) return state;

//     const updatedFolders = state.folders.map((folder) =>
//       folder.id === material.folderId
//         ? { ...folder, materialCount: Math.max(0, folder.materialCount - 1) }
//         : folder
//     );

//     return {
//       materials: state.materials.filter((m) => m.id !== id),
//       folders: updatedFolders,
//     };
//   }),

//   /**
//    * [백엔드 연결 필요] 문제 설정 업데이트
//    * API: PUT /api/materials/:id/settings
//    * Request: { multipleChoice: number, trueFalse: number }
//    */
//   updateMaterialSettings: (id, settings) => set((state) => ({
//     materials: state.materials.map((material) =>
//       material.id === id
//         ? { ...material, problemSettings: settings }
//         : material
//     ),
//   })),

//   /**
//    * [백엔드 연결 필요] 틀린 문제 삭제
//    * API: DELETE /api/materials/:materialId/problems/:problemId
//    * Response: { success: boolean }
//    */
//   deleteProblem: (materialId, problemId) => set((state) => ({
//     materials: state.materials.map((material) =>
//       material.id === materialId
//         ? {
//             ...material,
//             problems: material.problems.filter((p) => p.id !== problemId),
//           }
//         : material
//     ),
//   })),

//   /**
//    * [백엔드 연결 필요] 퀴즈 완료 및 결과 저장
//    * API: POST /api/materials/:id/review
//    * Request: {
//    *   results: Array<{ questionId, userAnswer, isCorrect }>,
//    *   score: number,
//    *   correctCount: number,
//    *   totalCount: number
//    * }
//    * Response: {
//    *   nextReviewDate: string,
//    *   reviewCount: number,
//    *   averageScore: number
//    * }
//    */
//   completeQuiz: (materialId, results) => set((state) => {
//     const material = state.materials.find((m) => m.id === materialId);
//     if (!material) return state;

//     // Calculate scores
//     const correctCount = results.filter((r) => r.userAnsweredCorrectly).length;
//     const totalCount = results.length;
//     const score = Math.round((correctCount / totalCount) * 100);

//     // CRITICAL: Filter out correctly answered problems - only keep incorrect ones
//     // Extract the Problem objects from results that were answered incorrectly
//     const newIncorrectProblems: Problem[] = results
//       .filter((r) => !r.userAnsweredCorrectly)
//       .map((r) => ({
//         id: r.id || `p${Date.now()}_${Math.random()}`,
//         type: r.type,
//         question: r.question,
//         options: r.options,
//         correctAnswer: r.correctAnswer,
//       } as Problem));

//     // ADD new incorrect problems to existing ones (accumulate)
//     const allIncorrectProblems = [...material.problems, ...newIncorrectProblems];

//     // Update review count and calculate new average score
//     const newReviewCount = material.reviewCount + 1;
//     const newAverageScore = Math.round(
//       ((material.averageScore * material.reviewCount) + score) / newReviewCount
//     );

//     // Add to review history
//     const today = new Date();
//     const newReviewHistory: ReviewHistory = {
//       date: formatDateISO(today),
//       score,
//       correctCount,
//       totalCount,
//     };

//     // Calculate next review date
//     const nextReviewDate = calculateNextReviewDate(newReviewCount);
//     const nextReviewISO = formatDateISO(nextReviewDate);

//     // 주석
//     // Schedule notification for next review
//     // scheduleReviewNotification(material.title, materialId, nextReviewISO)
//     //   .then((notificationId) => {
//     //     if (notificationId) {
//     //       console.log(`Scheduled review notification for ${material.title}`);
//     //     }
//     //   })
//     //   .catch((error) => {
//     //     console.error('Failed to schedule notification:', error);
//     //   });

//     // Update material
//     const updatedMaterials = state.materials.map((m) =>
//       m.id === materialId
//         ? {
//             ...m,
//             problems: allIncorrectProblems, // Keep existing + add new incorrect problems
//             lastReview: formatDateISO(today).replace(/-/g, '.'),
//             nextReview: nextReviewISO,
//             reviewCount: newReviewCount,
//             averageScore: newAverageScore,
//             reviewHistory: [...m.reviewHistory, newReviewHistory],
//           }
//         : m
//     );

//     return { materials: updatedMaterials };
//   }),
// }));
