<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import { fetchById, filterWithParams, withParams } from "../repository/product_repository";
import type { ProductWithComponents } from "../domain/productWithComponents";
import type { Bucha } from "../../bucha/domain/bucha_domain";
import { fetchBuchas } from "../../bucha/repository/bucha_repository";
import type { Acionamento } from "../../acionamento/domain/acionamento_domain";
import { fetchAcionamentos } from "../repository/acionamento_repository";
import type { Base } from "../../base/domain/base_domain";
import { fetchBases } from "../../base/repository/base_repository";
import type { DetailedProduct, Product } from "../domain/product";
import { useRouter } from "vue-router";
import { removeAccessTokens } from "../../../services/token";


export default defineComponent({
  setup() {
    const router = useRouter();
    const products = ref<ProductWithComponents[]>([]);
    const total = ref(0);
    const page = ref(1)
    const limit = ref(10);
    const loading = ref(false);
    const search = ref("");
    let timeout: number | undefined
    const filterBucha = ref("")
    const filterAcionamento = ref("")
    const filterBase = ref("")
    const buchas = ref< { id: number; tipobucha: string } []>([]);
    const acionamentos = ref<{ id: number; tipoacionamento: string }[]>([]);
    
    const bases = ref< { id: number; tipobase: string } []>([]);
    const fetchedProduct = ref<DetailedProduct | null>(null);

     const acionamentoSearchTerm = ref("");
     const buchaSearchTerm = ref("");
     const baseSearchTerm = ref("");


    const images = ref([
      "../../../../imgstorage/testes/ral.jpg",
      "../../../../imgstorage/testes/ral2.jpg",
      "../../../../imgstorage/testes/ral3.jpg",
    ]);
    

    const productsWithParams = async (options = {}): Promise<ProductWithComponents[]> => {
      loading.value = true;

      if (loading.value) {
        console.log('await loading');
        
      } 

      try {
        const data = await withParams({
          page: 1,
          limit: 10,
          ...options
        });
        console.log(data);
        products.value = data.products_with_params
        page.value = data.page
        limit.value = data.limit
        return data.products_with_params
      } catch (err) {
        console.log("Erro ao listar com parâmetros, ", err)
        return []
      } finally {
        loading.value = false;
      }
    }

    const onSearch = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        productsWithParams({ search: search.value })
      }, 400)
    }

     const filteredAcionamentos = computed(() => {
      return acionamentos.value.filter(a =>
        a.tipoacionamento.toLowerCase().includes(acionamentoSearchTerm.value.toLowerCase())
      );
    });

    const filteredBuchas = computed(() => {
      return buchas.value.filter(a =>
        a.tipobucha.toLowerCase().includes(buchaSearchTerm.value.toLowerCase())
      );
    });

    const filteredBases = computed(() => {
      return bases.value.filter(a =>
        a.tipobase.toLowerCase().includes(baseSearchTerm.value.toLowerCase())
      );
    });

    onMounted(async () => {
      
      products.value = await productsWithParams({page: page.value,  limit: limit.value})
      acionamentos.value = await fetchAcionamentos();
      buchas.value = await fetchBuchas();
      bases.value = await fetchBases();
    });

    const acionamentoMap = computed<Record<number, string>>(() => {
      const map: Record<number, string> = {};
      acionamentos.value.forEach(a => map[a.id] = a.tipoacionamento);
      return map;
    });

    const buchaMap = computed<Record<number, string>>(() => {
      const map: Record<number, string> = {};
      buchas.value.forEach(a => map[a.id] = a.tipobucha);
      return map;
    });

    const baseMap = computed<Record<number, string>>(() => {
      const map: Record<number, string> = {};
      bases.value.forEach(a => map[a.id] = a.tipobase);
      return map;
    });

    const isProductDetailsOpen = ref (false);

    const showProductDetails = async (p: Product) => {

      isProductDetailsOpen.value = true;

      console.log(fetchedProduct);

      const response = await fetchById(p.id); 

      fetchedProduct.value = {
      ...response,
      tipoacionamento: acionamentoMap.value[response.id_acionamento] || "Desconhecido",
      tipobucha: buchaMap.value[response.id_bucha] || "Desconhecido",
      tipobase: baseMap.value[response.id_base] || "Desconhecido",
      }
    }

    const filterWithParamsHandler = async () => {
  try {
    loading.value = true;

    // Log para debug
    console.log('Filtros aplicados:', {
      tipo_bucha: filterBucha.value,
      tipoacionamento: filterAcionamento.value,
      tipobase: filterBase.value
    });

        const response = await filterWithParams({
          tipo_bucha: filterBucha.value || undefined, // Não enviar string vazia
          tipoacionamento: filterAcionamento.value || undefined,
          tipobase: filterBase.value || undefined,
          page: page.value, // Usar page.value ao invés de 1 fixo
          limit: limit.value
        });

        console.log('Response recebida:', response);

        if (response && response.products_with_params) {
          products.value = response.products_with_params;
          total.value = response.total || 0;
          page.value = response.page || 1;

          console.log('✅ Produtos DEPOIS do filtro:', products.value.length);
          console.log('✅ Array atualizado:', products.value);
        } else {
          // Se não houver produtos, limpar a lista
          products.value = [];
          total.value = 0;
          console.log('Nenhum produto encontrado com os filtros aplicados');
        }

      } catch (error) {
        console.error('Erro ao filtrar produtos:', error);
        products.value = []; // Limpar em caso de erro
      } finally {
        loading.value = false;
      }
    } 

    const clearFilters = async () => {
      filterBucha.value = "";
      filterAcionamento.value = "";
      filterBase.value = "";
      await productsWithParams({ page: page.value, limit: limit.value });
    };
    

    const selectedImage = ref(images.value[0]);

    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }
    return {
      clearFilters,
      fetchedProduct,
      filteredAcionamentos,
      filteredBases,
      filteredBuchas,
      selectedImage,
      images,
      logout,
      products,
      total,
      page,
      limit,
      search,
      loading,
      productsWithParams,
      onSearch,
      filterBucha,
      filterWithParamsHandler,
      filterAcionamento,
      filterBase,
      buchas,
      acionamentos,
      bases,
      showProductDetails,
      isProductDetailsOpen
    };
  },
});
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-orange-200 to-orange-850 text-emerald-950 dark:from-gray-300 dark:to-gray-400 dark:text-slate-100">

    <transition
      enter-active-class="transition-opacity duration-700"
      leave-active-class="transition-opacity duration-700"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >

      <div
        v-if="isLoading"
        class="fixed inset-0 flex flex-col items-center justify-center bg-emerald-900 text-white z-50"
      >
        <svg
          class="animate-spin h-12 w-12 text-white mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span class="text-lg font-semibold">Carregando...</span>
      </div>
    </transition>

    <div class="flex flex-col items-center w-full">

       <div class="bg-emerald-900 w-full h-20"></div>


    <header class="mb-10 bg-gray-200 w-full h-28 flex items-center justify-between shadow-md rounded-xl px-8">

        <!-- Logo -->
        <div class="flex items-center justify-start w-1/3">
          <img 
            src="../../../../../imgstorage/logo/robustec.jpg" 
            alt="Logo" 
            class="h-28 object-contain mx-auto"
          >
        </div>

        <!-- Título central -->
        <h2 class="text-3xl font-bold text-neutral-950 text-center w-1/3">
          Lista de Produtos
        </h2>

        <!-- Ações à direita -->
        <div class="flex justify-end items-center gap-6 w-1/3">

          <h1 class="text-black font-medium">Produtos</h1>

          <button
            @click="logout"
            class="text-white bg-emerald-950 px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors hover:cursor-pointer"
          >
            Logout
          </button>

        </div>

      </header>

    <div class="flex justify-between items-center mb-5 gap-x-10">


      <input
        v-model="search"
        @input="onSearch"
        type="text"
        placeholder="Buscar produto por código..."
        class="p-3 rounded-lg w-80 bg-white text-black font-bold mb-7"
      >

    </div>

      <div class="flex flex-col gap-4 mb-15 text-black text-lg">
  
        <!-- Linha dos Selects -->
        <div class="flex flex-row gap-8">
          <select class="select select-md select-ghost h-12 bg-emerald-900 font-semibold text-white rounded-sm hover:cursor-pointer hover:bg-emerald-700 flex items-center gap-3 p-3" v-model="filterBucha">
            <option disabled value="">Tipo da bucha</option>
            <option v-for="bucha in filteredBuchas" :key="bucha.id" :value="bucha.tipobucha">{{ bucha.tipobucha }}</option>
          </select>

          <select class="select select-md select-ghost h-12 bg-emerald-900 font-semibold text-white rounded-sm hover:cursor-pointer hover:bg-emerald-700 flex items-center gap-3 p-3" v-model="filterAcionamento">
            <option disabled value="">Tipo do acionamento</option>
            <option v-for="acionamento in filteredAcionamentos" :key="acionamento.id" :value="acionamento.tipoacionamento">{{ acionamento.tipoacionamento }}</option>
          </select>

          <select class="select select-md select-ghost h-12 bg-emerald-900 font-semibold text-white rounded-sm hover:cursor-pointer hover:bg-emerald-700 flex items-center gap-3 p-3" v-model="filterBase">
            <option disabled value="">Tipo da base</option>
            <option v-for="base in filteredBases" :key="base.id" :value="base.tipobase">{{ base.tipobase }}</option>
          </select>
        </div>

        <!-- Linha dos Botões -->
        <div class="">
          <button @click="filterWithParamsHandler()" class="flex w-full items-center justify-center gap-3 h-12 px-4 bg-emerald-900 font-semibold text-white rounded-sm hover:cursor-pointer hover:bg-emerald-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 376 384">
              <path fill="currentColor" d="m267 235l106 106l-32 32l-106-106v-17l-6-6q-39 33-90 33q-58 0-98.5-40.5T0 138.5t40.5-98t98-40.5t98 40.5T277 139q0 51-33 90l6 6h17zm-128 0q40 0 68-28t28-68t-28-68t-68-28t-68 28t-28 68t28 68t68 28z"/>
            </svg>
            Filtrar
          </button>

          </div>

          <div class="">

          <button @click="clearFilters()" class="flex w-full items-center justify-center gap-3 h-12 px-4 bg-gray-600 font-semibold text-white rounded-sm hover:cursor-pointer hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Limpar Filtros
          </button>

          </div>



      </div>

      <!-- grid -->
      <div id="carros-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 justify-items-center w-full max-w-5xl">
        
        <!-- card exemplo -->
        <div v-for="product in products" :key="product.id"
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/testes/ral.jpg" alt="" class="object-cover rounded-t-xl h-70 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio {{ product.capacidade_estatica }} Kg Acionamento {{ product.tipoacionamento }}</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Código</h1>
              <h4 class="text-zinc-700 font-bold text-2xl">{{ product.codigo }}</h4>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="font-fira bg-emerald-700 w-full py-3 rounded-lg hover:bg-emerald-900 text-white font-bold text-lg hover:cursor-pointer" @click="showProductDetails(product)">
               Ver detalhes
              </button>  
          </div>
        </div>


        <div
          v-if="isProductDetailsOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black/60"
        >
          <div class="relative bg-gray-300 p-6 rounded-lg shadow-lg w-[95%] max-w-5xl h-[60%] max-h-[%90] p-20">

            <button
              @click="isProductDetailsOpen = false"
              class="absolute top-4 right-4 text-gray-700 transition-colors p-3 hover:cursor-pointer hover:bg-gray-400 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                class="w-7 h-7"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Grid responsiva -->
            <div class="grid grid-cols-2 gap-4">
        
            <!-- Coluna da esquerda: imagens -->
            <div class="grid grid-rows-2 h-[90%] w-full gap-4">
              
              <!-- Imagem principal -->
              <div class="h-full flex justify-start">
                <img
                  :src="selectedImage"
                  alt="Imagem principal"
                  class="h-full object-fill rounded transition-all duration-300"
                />
              </div>

              <!-- Miniaturas -->
              <div class="grid grid-cols-3 gap-4 h-full w-4/5">
                <img
                  v-for="(img, index) in images"
                  :key="index"
                  :src="img"
                  alt="Miniatura"
                  class="w-full h-auto object-contain rounded cursor-pointer border-2"
                  :class="selectedImage === img ? 'border-emerald-700' : 'border-transparent'"
                  @click="selectedImage = img"
                />
              </div>
              
            </div>

              
              <!-- Coluna do Formulário -->
              <div class="flex flex-col justify-start">
                <!-- Campos -->
                <div class="space-y-4">
                  
                  <div>
                    <h1 class="w-full font-fira text-emerald-900 text-2xl font-bold">Pé de Apoio {{ fetchedProduct?.capacidade_estatica }} Kg Acionamento {{ fetchedProduct?.tipoacionamento }} {{ fetchedProduct?.codigo }}</h1>
                  </div>

                  <div class="mt-10">
                      <h1 class="w-full font-fira text-gray-600 text-md">{{ fetchedProduct?.description }}</h1>
                  </div>

                  <div class="mt-10 space-y-4">

                  <div>
                    <h1 class="w-full font-fira text-gray-700 text-md"> <span class="font-semibold text-black">* Capacidade: </span>{{ fetchedProduct?.capacidade_estatica }} kg</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-700 text-md"><span class="font-semibold text-black">* Base: </span>{{ fetchedProduct?.tipobase }}</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-700 text-md"><span class="font-semibold text-black">* Bucha de fixação: </span>{{ fetchedProduct?.tipobucha }}</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-700 text-md"><span class="font-semibold text-black">* Acionamento: </span>{{ fetchedProduct?.tipoacionamento }}</h1>
                  </div>

                  </div>



                </div>

            </div>

            </div>

            </div>

            <!-- -->

          </div>

        <!-- Repita o card ou use v-for -->
        
      </div>

      <footer class="bg-white dark:bg-emerald-950 text-black dark:text-white w-full mt-10">
        <div class="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center space-y-6">
          <!-- Logo -->
          <img src="../../../../../imgstorage/logo/robusteclogo.png" alt="Logo" class="h-20">

          <!-- Links -->
          <nav class="flex flex-wrap justify-center gap-6 text-base">
            <a href="#" class="hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="hover:text-green-900 hover:underline">XXXX</a>
            <a href="#" class="hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="hover:text-green-900 hover:underline">XXX</a>
          </nav>

          <!-- Redes sociais -->
          <div class="flex space-x-5">
            <a target="_blank" href="https://www.instagram.com/robustec_ltda" class="hover:text-pink-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-instagram h-10 w-10" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                  </svg>
            </a>
            <a target="_blank" href="https://web.facebook.com/Robustec.ltda"  class="hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-facebook h-10 w-10" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                      </svg> 
            </a>
          </div>

          <!-- Linha divisória -->
          <hr class="w-full border-t border-gray-300 dark:border-gray-600">

          <!-- Direitos -->
          <div class="flex flex-col sm:flex-row justify-between items-center w-full text-sm">
            <p>&copy; 2025 - Robustec. 
              <a href="#" class="hover:underline"> Termos e Condições</a>
            </p>
            <p>
              <a href="#" class="hover:underline">Privacidade</a> | 
              <a href="#" class="hover:underline">Cookies</a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  </main>
</template>