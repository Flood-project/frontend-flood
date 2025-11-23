export interface Product {
    id: number;
    codigo: string;
    description: string;
    capacidade_estatica: number;
    capacidade_trabalho: number;
    reducao: string;
    altura_bucha: number;
    curso: number;
    id_bucha: number;
    id_acionamento: number;
    id_base: number;
    ativo: boolean;
} 

export interface DetailedProduct extends Product {
  tipoacionamento: string;
  tipobucha: string;
  tipobase: string;
}

export interface CreatedProduct {
  
    codigo: string;
    description: string;
    capacidade_estatica: number;
    capacidade_trabalho: number;
    reducao: string;
    altura_bucha: number;
    curso: number;
    id_bucha: number;
    id_acionamento: number;
    id_base: number;
    ativo: boolean;
} 