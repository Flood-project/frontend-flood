// import { instance } from "../../../services/axios";

// export const getImageUrl = async (storageKey: string): Promise<string> => {
//     if (!storageKey) return '';
    
//     try {
//         const response = await instance.get(`/files/url/${storageKey}`);
//         console.log(response);
        
//         return response.data.url; 
//     } catch (error) {
//         console.log(error);
//         return '';
//     }
// };

// export interface UploadResponse {
//   id: number;
//   url: string;
//   storageKey: string;
//   fileName: string;
//   size: number;
//   contentType: string;
// }

// export const uploadProductImage = async (productId: number, file: File): Promise<UploadResponse> => {
//   const formData = new FormData();
//   formData.append('file', file); // ← EXATAMENTE COMO NA IMAGEM
  
//   console.log('Fazendo upload para produto ID:', productId, 'Arquivo:', file.name);
  
//   try {
//     const response = await instance.post(`/files/${productId}`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data', // ← HEADER CORRETO
//       },
//     });
    
//     console.log('Upload realizado com sucesso:', response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error('Erro no upload da imagem:', {
//       productId,
//       fileName: file.name,
//       status: error.response?.status,
//       data: error.response?.data,
//       message: error.message
//     });
//     throw new Error(`Falha no upload da imagem: ${error.response?.data || error.message}`);
//   }
// };