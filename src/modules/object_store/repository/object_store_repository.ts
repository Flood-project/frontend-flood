import { instance } from "../../../services/axios"
import type { File } from "../domain/object_store"

export async function createFile (file: File, productID: number) {
    try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await instance.post(`/files/${productID}`, formData);
        return response.data
    } catch (error) {
        console.log("Erro ao criar novo arquivo: ", error);
    }
}