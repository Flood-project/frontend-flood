<script lang="ts">
import { defineComponent, ref, onMounted, computed, onUnmounted, watch } from "vue";
import type { Product, DetailedProduct } from "../../domain/product"; 
import type { Base } from "../../domain/base"; 
import type { Acionamento } from "../../domain/acionamento"; 
import type { Bucha } from "../../domain/bucha"; 
import { useRouter } from "vue-router";
import { fetchProducts, updateProduct, deleteProductById, createProduct, fetchById, withParams, filterWithParams } from "../../repository/product_repository";
import { fetchAcionamentoById, fetchAcionamentos, createAcionamento, deleteAcionamentoById } from "../../repository/acionamento_repository"
import { fetchBuchas, createBucha, deleteBuchaById } from "../../../bucha/repository/bucha_repository"
import { fetchBases, fetchBaseById, createBase, deleteBaseById } from "../../repository/base_repository"
import type { ProductWithComponents } from "../../domain/productWithComponents";
import { removeAccessTokens } from "../../../../services/token";
import { router } from "../../../../router";
import { getClaims } from "../../../../services/jwt_decoder";
import { createFile } from "../../../object_store/repository/object_store_repository";


export default defineComponent({
  setup() {

    const isLoading = ref(true);

    const images = ref([
      "../../../../imgstorage/testes/ral.jpg",
      "../../../../imgstorage/testes/ral2.jpg",
      "../../../../imgstorage/testes/ral3.jpg",
    ]);

    const acionamentos = ref<{ id: number; tipoacionamento: string }[]>([]);
    const showAcionamentosDropdown = ref(false);
    const acionamentoSearchTerm = ref("");
    const selectedAcionamento = ref<{ id: number; tipoacionamento: string } | null>(null);

    const products = ref<Product[]>([]);
    const editingProduct = ref<DetailedProduct | null>(null);
    const newProduct = ref<Product | null>(null);
    const fetchedProduct = ref<DetailedProduct | null>(null);

    const buchas = ref< { id: number; tipobucha: string } []>([]);
    const newBucha = ref<Bucha | null>(null);
    const selectedBucha = ref<{ id: number; tipobucha: string } | null>(null);
    const showBuchasDropdown = ref(false);
    const buchaSearchTerm = ref("");

    const newAcionamento = ref<Acionamento | null>(null);

    const bases = ref< { id: number; tipobase: string } []>([]);
    const newBase = ref<Base | null>(null);
    const selectedBase = ref<{ id: number; tipobase: string } | null>(null);
    const showBasesDropdown = ref(false);
    const baseSearchTerm = ref("");

    const loading = ref(false);
    const search = ref("");
    const page = ref(1);
    const limit = ref(10);
    const total = ref(0)
    let timeout: number | undefined
    const filterBucha = ref("")
    const filterAcionamento = ref("")
    const filterBase = ref("")
    const productsWithComponents = ref<ProductWithComponents[]>([])


    newProduct.value = { id: 0,codigo: "", description: "", capacidade_estatica: 0, capacidade_trabalho: 0, reducao: "", altura_bucha: 0, curso: 0, id_bucha: 0, id_acionamento: 0, id_base: 0};

    newBucha.value = { id: 0, tipobucha: ""};

    newBase.value = { id: 0, tipobase: ""};

    newAcionamento.value = { id: 0, tipoacionamento: ""};

    const isBuchaFilterWithValue = computed(() => {
      return filterBucha.value !== "" && filterBucha.value !== null && filterBucha.value !== undefined;
    });

    const isAcionamentoFilterWithValue = computed(() => {
      return filterAcionamento.value !== "" && filterAcionamento.value !== null && filterAcionamento.value !== undefined;
    });

    const isBaseFilterWithValue = computed(() => {
      return filterBase.value !== "" && filterBase.value !== null && filterBase.value !== undefined;
    });

    const hasAnyFilter = computed(() => {
      return !!(filterBucha.value || filterAcionamento.value || filterBase.value);
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

    const produtosCompletos = computed(() =>
      products.value.map(p => ({
        ...p,
        tipoacionamento: acionamentoMap.value[p.id_acionamento] || 'Desconhecido',
        tipobucha: buchaMap.value[p.id_bucha] || 'Desconhecido',
        tipobase: baseMap.value[p.id_base] || 'Desconhecido',
      }))
    );


    const product = ref<Product>();

    const isEditModalOpen = ref(false)

    watch(isEditModalOpen, (isOpen) => {

      if (isOpen && editingProduct.value) {
        buchaSearchTerm.value = editingProduct.value.tipobucha || ''
        baseSearchTerm.value = editingProduct.value.tipobase || ''
        acionamentoSearchTerm.value = editingProduct.value.tipoacionamento || ''
      }

      else {
        buchaSearchTerm.value = ''
        baseSearchTerm.value = ''
        acionamentoSearchTerm.value = ''
      }
    })

    onUnmounted(() => document.removeEventListener("click", handleClickOutside));

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

    const selectAcionamento = (a: { id: number; tipoacionamento: string }) => {
      selectedAcionamento.value = a;
      if (newProduct.value) {
        newProduct.value.id_acionamento = a.id;
      }
      acionamentoSearchTerm.value = a.tipoacionamento;
      showAcionamentosDropdown.value = false;
    };

    const selectBucha = (a: { id: number; tipobucha: string }) => {
      selectedBucha.value = a;
      if (newProduct.value) {
        newProduct.value.id_bucha = a.id;
      }
      buchaSearchTerm.value = a.tipobucha;
      showBuchasDropdown.value = false;
    };

    const selectBase = (a: { id: number; tipobase: string }) => {
      selectedBase.value = a;
      if (newProduct.value) {
        newProduct.value.id_base = a.id;
      }
      baseSearchTerm.value = a.tipobase;
      showBasesDropdown.value = false;
    };
    

    // Excluir produto
    const deleteProduct = async (id: number) => {
      await deleteProductById(id); // chamada ao repositório / API
      products.value = products.value.filter((p) => p.id !== id);
    };


    const isAddModalOpen = ref (false);

    const isProductDetailsOpen = ref (false);

    const isAddBuchaModalOpen = ref (false);

    const isAddAcionamentoModalOpen = ref (false);

    const isAddBaseModalOpen = ref (false);

    const isAdicionarOpen = ref(false);


    const menuRef = ref<HTMLElement | null>(null);

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
        isAdicionarOpen.value = false;
      }
      const dropdown = document.querySelector(".relative");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        showAcionamentosDropdown.value = false;
        showBasesDropdown.value = false;
        showBuchasDropdown.value = false;
      }
    }

    function toggleAddMenu() {
      isAdicionarOpen.value = !isAdicionarOpen.value;
    }

    function selectAddOption(action: Function) {
      action();
      isAdicionarOpen.value = false;
    }

    const errorMessageAcionamento = ref('');
    const errorMessageBucha = ref('');
    const errorMessageBase = ref('');

    const addBucha = async (newBucha: Bucha) => {

      errorMessageBucha.value = '';
      
      isAddBuchaModalOpen.value = true;
      
      if (!newBucha.tipobucha || newBucha.tipobucha .trim() === '') {
        errorMessageBucha.value = 'O tipo da bucha é obrigatório.';
        return;
      }

      await createBucha(newBucha);
      isAddBuchaModalOpen.value = false;
    };

    const addAcionamento = async (newAcionamento: Acionamento) => {

      errorMessageAcionamento.value = '';

      isAddAcionamentoModalOpen.value = true;
      
      if (!newAcionamento.tipoacionamento || newAcionamento.tipoacionamento.trim() === '') {
        errorMessageAcionamento.value = 'O tipo do acionamento é obrigatório.';
        return;
      }

      await createAcionamento(newAcionamento);
      isAddAcionamentoModalOpen.value = false;
    };

    const addBase = async (newBase: Base) => {

      errorMessageBase.value = '';

      isAddBaseModalOpen.value = true;
      
      if (!newBase.tipobase || newBase.tipobase.trim() === '') {
        errorMessageBase.value = 'O tipo da base é obrigatório.';
        return;
      }

      await createBase(newBase);
      isAddBaseModalOpen.value = false;
    };

      const addOptions = ref([
      { label: "Produtos", action: openAddModal },
      { label: "Buchas", action: addBucha },
      { label: "Acionamentos", action: addAcionamento },
      { label: "Bases", action: addBase },
    ]);

    const productId = ref(0)
    function openEditModal(product: Product) {
      productId.value = product.id
      editingProduct.value = {
        ...product,
        tipoacionamento: acionamentoMap.value[product.id_acionamento] || "Desconhecido",
        tipobucha: buchaMap.value[product.id_bucha] || "Desconhecido",
        tipobase: baseMap.value[product.id_base] || "Desconhecido",
      };
      isEditModalOpen.value = true
    }

    function openAddModal() {
      newProduct.value = { id: 0,codigo: "", description: "", capacidade_estatica: 0, capacidade_trabalho: 0, reducao: "", altura_bucha: 0, curso: 0, id_bucha: 0, id_acionamento: 0, id_base: 0};
      isAddModalOpen.value = true
    }

    

    const isLoadingDetails = ref(false);

    const showProductDetails = async (p: Product) => {
      selectedProduct.value = p
      if (p.images) {
        selectedImage.value = p.images[0]?.url || ""
        console.log(selectedImage.value);
      }
      
      try {
        isLoadingDetails.value = true;

        const response = await fetchById(p.id);

        fetchedProduct.value = {
          ...response,
          tipoacionamento: acionamentoMap.value[response.id_acionamento] || "Desconhecido",
          tipobucha: buchaMap.value[response.id_bucha] || "Desconhecido",
          tipobase: baseMap.value[response.id_base] || "Desconhecido",
        };

        // Delay mínimo para mostrar feedback visual
        await new Promise(resolve => setTimeout(resolve, 200));

        isProductDetailsOpen.value = true;

      } catch (error) {
        console.error('❌ Erro ao carregar detalhes:', error);
        alert('Erro ao carregar os detalhes do produto. Tente novamente.');
      } finally {
        isLoadingDetails.value = false;
      }
    };

    // Salvar edição
    const editProduct = async (editingProduct: Product) => {
      console.log(editingProduct);
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, editingProduct);
        // atualiza na lista

        const enriched: DetailedProduct = {
          ...updated,
          tipoacionamento: acionamentoMap.value[updated.id_acionamento] || "Desconhecido",
          tipobucha: buchaMap.value[updated.id_bucha] || "Desconhecido",
          tipobase: baseMap.value[updated.id_base] || "Desconhecido",
        };

        const index = products.value.findIndex((p) => p.id === enriched.id);
        if (index !== -1) {
          products.value[index] = enriched;
        }
        isEditModalOpen.value = false // fecha modal/edição
      }
    };

    const addProduct = async (newProduct: Product) => {
      console.log(acionamentos.value)
      console.log(newProduct, "antes de chamar create product");
      if (newProduct) {
        await createProduct(newProduct);
        console.log(newProduct, "depois de chamar create product")
        isAddModalOpen.value = false // fecha modal/edição
      }
    };

    const productsWithParams = async (options = {}): Promise<ProductWithComponents[]> => {
      isLoading.value = true;

      if (isLoading.value) {
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
        isLoading.value = false;
      }
    }

    const isLoadingFilters = ref (false);

     const filterWithParamsHandler = async () => {
      try {
        isLoadingFilters.value = true;

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
            isLoadingFilters.value = false;
          }
        }

    const onSearch = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        productsWithParams({ search: search.value })
      }, 400)
    }

    const clearFilters = async () => {
      filterBucha.value = "";
      filterAcionamento.value = "";
      filterBase.value = "";
      await productsWithParams({ page: page.value, limit: limit.value });
    };

    const selectedImage = ref(null);
    const selectedProduct = ref(null)

    const redirectToLogs = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/logs'})
        } else {
          router.push({path: '/'})
        }

    };
   
    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }

    const handleFileInput = (event) => {
      const file = event.target.files[0]
      if (file) {
        selectedImage.value = file
        uploadFile(selectedImage.value)
      }
    }

    const uploadFile = async (selectedImage) => {
      try {
        await createFile(selectedImage, productId.value)
        await productsWithParams({page: page.value,  limit: limit.value})
      } catch (error) {
        console.error('Erro no upload:', error)
      } 
    }

    const paginateAhead = async () => {
      try {
        isLoading.value = true;
        const response = await filterWithParams({
          tipo_bucha: filterBucha.value || undefined,
          tipoacionamento: filterAcionamento.value || undefined,
          tipobase: filterBase.value || undefined,
          page: page.value + 1,
        });
        
        products.value = response.products_with_params;
        page.value = page.value + 1
      } catch(error){
        console.log(error);
      } finally {
        isLoading.value = false;
      }
    }

    const paginateReturn = async () => {
      try {
        isLoading.value = true;
        const response = await filterWithParams({
          tipo_bucha: filterBucha.value || undefined,
          tipoacionamento: filterAcionamento.value || undefined,
          tipobase: filterBase.value || undefined,
          page: page.value - 1
        });
        
        products.value = response.products_with_params;
        page.value = page.value - 1
      } catch(error){
        console.log(error);
      } finally {
        isLoading.value = false;
      }
    }

    onMounted(async () => {
      products.value = await productsWithParams({page: page.value,  limit: limit.value})
      acionamentos.value = await fetchAcionamentos();
      buchas.value = await fetchBuchas();
      bases.value = await fetchBases();
      document.addEventListener("click", handleClickOutside);
      await new Promise(resolve => setTimeout(resolve, 1000))
      isLoading.value = false
    });

    return {
      isLoadingFilters,
      isBuchaFilterWithValue,
      isBaseFilterWithValue,
      isAcionamentoFilterWithValue,
      hasAnyFilter,
      redirectToLogs,
      isLoadingDetails,
      clearFilters,
      isLoading,
      images,
      selectedImage,
      product,
      products,
      editingProduct,
      newProduct,
      fetchedProduct,
      deleteProduct,
      editProduct,
      openEditModal,
      isEditModalOpen,
      isAddModalOpen,
      openAddModal,
      addProduct,
      showProductDetails,
      isProductDetailsOpen,
      addBucha,
      addAcionamento,
      errorMessageAcionamento,
      errorMessageBucha,
      errorMessageBase,
      addBase,
      toggleAddMenu,
      selectAddOption,
      isAdicionarOpen,
      addOptions,
      isAddBuchaModalOpen,
      isAddBaseModalOpen,
      isAddAcionamentoModalOpen,
      newBucha,
      newAcionamento,
      newBase,
      acionamentoSearchTerm,
      baseSearchTerm,
      buchaSearchTerm,
      showAcionamentosDropdown,
      showBuchasDropdown,
      showBasesDropdown,
      filteredAcionamentos,
      filteredBases,
      filteredBuchas,
      selectAcionamento,
      selectBase,
      selectBucha,
      produtosCompletos,
      total,
      page,
      limit,
      onSearch,
      productsWithParams,
      loading,
      search,
      filterBucha,
      filterWithParamsHandler,
      filterAcionamento,
      filterBase,
      logout,
      handleFileInput,
      selectedProduct,
      paginateAhead,
      paginateReturn,
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

     <header class="mb-10 bg-gray-200 w-full h-28 flex items-center justify-center shadow-md rounded-xl px-8">

        <div class="w-full max-w-screen-2xl px-4 flex items-center justify-between">

          <!-- Logo -->
          <div class="flex items-center justify-start">
            <img 
              src="../../../../../imgstorage/logo/robustec.jpg" 
              alt="Logo" 
              class="h-28 object-contain mx-auto"
            >
          </div>

          <!-- Título central -->
          <h2 class="text-3xl font-bold text-neutral-950 text-center flex-1">
            Lista de Produtos
          </h2>

          <!-- Ações à direita -->
          <div class="flex justify-end items-center gap-6">

            <button
              @click="redirectToLogs"
              class="text-black font-semibold flex flex-col-2 gap-3 bg-gray-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ring-2 ring-orange-700"
            >
              Auditoria
            </button>

            <div ref="menuRef" class="relative inline-block text-left">
              <button
                @click="toggleAddMenu"
                class="text-black font-semibold flex flex-col-2 gap-3 bg-gray-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ring-2 ring-emerald-700"
              >

                <svg class="w-6 h-6 text-black dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                </svg>


                Adicionar
              </button>

              <!-- Dropdown -->
              <div
                v-if="isAdicionarOpen"
                class="absolute left-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div class="py-1">
                  <a
                    v-for="addOption in addOptions"
                    :key="addOption.label"
                    href="#"
                    @click.prevent="selectAddOption(addOption.action)"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {{ addOption.label }}
                  </a>
                </div>
              </div>
            </div>

            <button
              @click="logout"
              class="text-white bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
            >
              Sair
            </button>

          </div>

        </div>

      </header>

      <!-- título -->

    <div class="w-full max-w-screen-2xl mx-auto px-4 mt-10">
  
      <!-- Container principal: Filtros + Conteúdo -->
      <div class="flex gap-6">
        
        <!-- Sidebar de filtros (esquerda) -->
        <aside class="w-64 flex-shrink-0">
          <div class="bg-white/50 dark:bg-gray-350 rounded-lg p-4 space-y-4 sticky top-4 shadow-3xl">
            <h3 class="text-2xl font-semibold text-black mb-4">Filtros</h3>
            
            <!-- Filtro Bucha -->
            <div>
              <label class="block text-sm font-medium text-black mb-2">Tipo da Bucha</label>
              <select 
                v-model="filterBucha"
                class="w-full h-10 bg-white font-semibold text-black rounded-lg px-3 hover:cursor-pointer hover:bg-gray-300 transition-colors"
              >
                <option disabled value="">Selecione</option>
                <option v-for="bucha in filteredBuchas" :key="bucha.id" :value="bucha.tipobucha">
                  {{ bucha.tipobucha }}
                </option>
              </select>
            </div>

            <!-- Filtro Acionamento -->
            <div>
              <label class="block text-sm font-medium text-black mb-2">Tipo do Acionamento</label>
              <select 
                v-model="filterAcionamento"
                class="w-full h-10 bg-white font-semibold text-black rounded-lg px-3 hover:cursor-pointer hover:bg-gray-300  transition-colors"
              >
                <option disabled value="">Selecione</option>
                <option v-for="acionamento in filteredAcionamentos" :key="acionamento.id" :value="acionamento.tipoacionamento">
                  {{ acionamento.tipoacionamento }}
                </option>
              </select>
            </div>

            <!-- Filtro Base -->
            <div>
              <label class="block text-sm font-medium text-black mb-2">Tipo da Base</label>
              <select 
                v-model="filterBase"
                class="w-full h-10 bg-white font-semibold text-black rounded-lg px-3 hover:cursor-pointer hover:bg-gray-300 transition-colors"
              >
                <option disabled value="">Selecione</option>
                <option v-for="base in filteredBases" :key="base.id" :value="base.tipobase">
                  {{ base.tipobase }}
                </option>
              </select>
            </div>

            <!-- Botões de ação -->
            <div class="space-y-2 pt-4">
              <button 
                @click="filterWithParamsHandler()" 
                :class="[
                  'w-full flex items-center justify-center gap-2 h-10 font-semibold rounded-lg transition-all duration-300',
                  hasAnyFilter && !isLoadingFilters
                    ? 'bg-emerald-800 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg hover:cursor-pointer' 
                    : 'bg-gray-400 cursor-not-allowed text-gray-200'
                ]"
                :disabled="!hasAnyFilter || isLoadingFilters"
              >
                <!-- Ícone de busca (quando NÃO está carregando) -->
                <svg 
                  v-if="!isLoadingFilters"
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 376 384"
                >
                  <path fill="currentColor" d="m267 235l106 106l-32 32l-106-106v-17l-6-6q-39 33-90 33q-58 0-98.5-40.5T0 138.5t40.5-98t98-40.5t98 40.5T277 139q0 51-33 90l6 6h17zm-128 0q40 0 68-28t28-68t-28-68t-68-28t-68 28t-28 68t28 68t68 28z"/>
                </svg>
                
                <!-- Spinner (quando está carregando) -->
                <svg 
                  v-else
                  class="animate-spin h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                
                <!-- Texto dinâmico -->
                <span>
                  {{ 
                    isLoadingFilters 
                      ? 'Carregando...' 
                      : (hasAnyFilter ? 'Filtrar' : 'Selecione um filtro') 
                  }}
                </span>
              </button>

              <button 
                v-if="hasAnyFilter"
                @click="clearFilters()" 
                class="w-full flex items-center justify-center gap-2 h-10 bg-gray-600 font-semibold text-white rounded-lg hover:cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Limpar
              </button>
            </div>
          </div>
        </aside>

        <!-- Área principal (direita) - AGORA COM SEARCH DENTRO -->
        <main class="flex-1">
          
          <!-- Barra superior: Search + Novo Produto (alinhado com o grid) -->
          <div class="flex justify-between items-center mb-6 gap-6">
            <!-- Search (esquerda) -->
            <input
              v-model="search"
              @input="onSearch"
              type="text"
              placeholder="Buscar produto por código..."
              class="p-3 rounded-lg w-80 bg-white text-black font-bold w-full"
            />

            <!-- Novo Produto (direita) -->
            <button
              @click="openAddModal()"
              class="h-12 bg-emerald-800 font-semibold text-white rounded-lg hover:cursor-pointer hover:bg-emerald-600 flex items-center gap-3 px-4 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Novo Produto
            </button>
          </div>

          <!-- Grid de produtos -->
          <div id="produtos-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div v-for="product in products" :key="product.id"
              class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl"
            >
               <div v-if="product.images && product.images.length > 0">
                <img 
                  :src="product.images[0].url" 
                  :alt="product.images[0].file_name"
                >
                <!-- class for images if too big: class="w-full h-100 object-cover" -->
              </div>
              <div v-else class="w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center">
                <span class="text-gray-500">Sem imagem</span>
              </div>
              <!-- Foto -->
              <!-- <img src="../../../../../imgstorage/testes/ral.jpg" alt="" class="object-cover rounded-t-xl h-90 w-full"> -->

              <!-- Conteúdo -->
              <div class="p-5 flex flex-col space-y-4">
                <!-- Tipo e nome -->
                <div>
                  <h1 class="font-fira text-emerald-800 text-sm">Novo</h1>
                  <h1 class="font-fira text-zinc-800 text-xl font-semibold">
                    Pé de Apoio {{ product.capacidade_estatica }} Kg Acionamento {{ product.tipoacionamento }}
                  </h1>
                </div>

                <!-- Código -->
                <div>
                  <h1 class="font-fira text-zinc-800 text-sm">Código</h1>
                  <div class="flex items-center justify-between">
                    <h1 class="font-fira text-zinc-700 font-bold text-2xl">{{ product.codigo }}</h1>
                    
                    <!-- Botões de ação -->
                    <div class="flex gap-2">
                      <div class="relative group">
                        <button 
                          class="p-1.5 bg-emerald-800 text-white rounded-sm hover:bg-emerald-600 transition-colors hover:cursor-pointer" 
                          @click="openEditModal(product)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <span class="font-fira absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Editar
                        </span>
                      </div>

                      <div class="relative group">
                        <button 
                          class="p-1.5 bg-red-900 text-white rounded-sm hover:bg-red-700 transition-colors hover:cursor-pointer"
                          @click="deleteProduct(product.id)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <span class="font-fira absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Remover
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botão Ver Detalhes -->
                <button 
                  class="font-fira bg-emerald-800 w-full py-3 rounded-lg hover:cursor-pointer hover:bg-emerald-600 text-white font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  @click="showProductDetails(product)"
                  :disabled="isLoadingDetails"
                >
                  <svg 
                    v-if="isLoadingDetails" 
                    class="animate-spin h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {{ isLoadingDetails ? 'Carregando...' : 'Ver detalhes' }}
                </button>
              </div>
            </div>

          </div>

          <!-- Mensagem quando não há produtos -->
          <div v-if="!loading && products.length === 0" class="text-center py-20">
            <p class="text-xl text-gray-600">Nenhum produto encontrado.</p>
          </div>
        </main>

    </div>
    <!-- paginação -->
    <div class="paginationBack">
      <div class="pagination">
        <button
          class="btnPagination bg-emerald-800"
          @click="paginateReturn"
        > 
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
          </svg>
        </button>
        <button 
          class="btnPagination bg-emerald-800"
          @click="paginateAhead"
        >
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
          </svg>
        </button>
      </div>
      <p class="mt-3">Página {{ page }}</p>
    </div>
    

        <!-- Modal editar -->
        <div
          v-if="isEditModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4"
        >
          <div class="relative bg-neutral-200 rounded-4xl shadow-2xl w-full max-w-6xl max-h-[90vh]">
            
            
            <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-3xl font-bold text-black">Editar Produto</h3>
                  <p class="text-black text-sm mt-1">Altere as informações do produto</p>
                </div>
                <button
                  @click="isEditModalOpen = false"
                  class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

           
            <div class="overflow-y-auto max-h-[calc(90vh-180px)] px-8 py-6">
              
              
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Informações Básicas
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Código <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="editingProduct!.codigo"
                      type="text"
                      placeholder="Ex: RAL-1234"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <!-- Capacidade Estática -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Capacidade Estática (KG) <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="editingProduct!.capacidade_estatica"
                      type="number"
                      placeholder="Ex: 5000"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Capacidade de Trabalho (KG) <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="editingProduct!.capacidade_trabalho"
                      type="number"
                      placeholder="Ex: 2500"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>
                </div>
              </div>

             
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
                  </svg>
                  Componentes
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Acionamento <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <div class="flex gap-2">
                        <div class="relative flex-1">
                          <input
                            v-model="acionamentoSearchTerm"
                            type="text"
                            placeholder="Buscar ou selecionar"
                            class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 transition-all"
                            @focus="showAcionamentosDropdown = true"
                            @click.stop
                          />
                          <button
                            v-if="acionamentoSearchTerm"
                            @click="acionamentoSearchTerm = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors hover:cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button
                          @click="isAddAcionamentoModalOpen = true"
                          class="px-3 py-2.5 bg-white hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer"
                          title="Adicionar novo acionamento"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-black">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                      
                      <!-- Dropdown -->
                      <ul
                        v-if="showAcionamentosDropdown && filteredAcionamentos.length > 0"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-xl max-h-48 overflow-y-auto z-20"
                        @click.stop
                      >
                        <li
                          v-for="a in filteredAcionamentos"
                          :key="a.id"
                          @click="selectAcionamento(a)"
                          class="px-4 py-2.5 text-black hover:bg-gray-200 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {{ a.tipoacionamento }}
                        </li>
                      </ul>
                      <div v-if="showAcionamentosDropdown && filteredAcionamentos.length === 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg p-4 text-black text-sm text-center">
                        Nenhum acionamento encontrado
                      </div>
                    </div>
                  </div>

                  <!-- Bucha -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Bucha <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <div class="flex gap-2">
                        <div class="relative flex-1">
                          <input
                            v-model="buchaSearchTerm"
                            type="text"
                            placeholder="Buscar ou selecionar"
                            class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 transition-all"
                            @focus="showBuchasDropdown = true"
                            @click.stop
                          />
                          <button
                            v-if="buchaSearchTerm"
                            @click="buchaSearchTerm = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors hover:cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button
                          @click="isAddBuchaModalOpen = true"
                          class="px-3 py-2.5 bg-white hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer"
                          title="Adicionar nova bucha"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-black">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                      
                      <ul
                        v-if="showBuchasDropdown && filteredBuchas.length > 0"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-xl max-h-48 overflow-y-auto z-20"
                        @click.stop
                      >
                        <li
                          v-for="a in filteredBuchas"
                          :key="a.id"
                          @click="selectBucha(a)"
                          class="px-4 py-2.5 text-black hover:bg-gray-200 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {{ a.tipobucha }}
                        </li>
                      </ul>
                      <div v-if="showBuchasDropdown && filteredBuchas.length === 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg p-4 text-black text-sm text-center">
                        Nenhuma bucha encontrada
                      </div>
                    </div>
                  </div>

                  <!-- Base -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Base <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <div class="flex gap-2">
                        <div class="relative flex-1">
                          <input
                            v-model="baseSearchTerm"
                            type="text"
                            placeholder="Buscar ou selecionar"
                            class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 transition-all"
                            @focus="showBasesDropdown = true"
                            @click.stop
                          />
                          <button
                            v-if="baseSearchTerm"
                            @click="baseSearchTerm = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors hover:cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button
                          @click="isAddBaseModalOpen = true"
                          class="px-3 py-2.5 bg-white hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer"
                          title="Adicionar nova base"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-black">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                      
                      <ul
                        v-if="showBasesDropdown && filteredBases.length > 0"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-xl max-h-48 overflow-y-auto z-20"
                        @click.stop
                      >
                        <li
                          v-for="a in filteredBases"
                          :key="a.id"
                          @click="selectBase(a)"
                          class="px-4 py-2.5 text-black hover:bg-gray-200 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {{ a.tipobase }}
                        </li>
                      </ul>
                      <div v-if="showBasesDropdown && filteredBases.length === 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg p-4 text-black text-sm text-center">
                        Nenhum acionamento encontrado
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Seção: Medidas -->
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                  </svg>
                  Medidas
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">Curso (mm)</label>
                    <input
                      v-model="editingProduct!.curso"
                      type="number"
                      placeholder="Ex: 150"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-black mb-2">Altura da Bucha (mm)</label>
                    <input
                      v-model="editingProduct!.altura_bucha"
                      type="number"
                      placeholder="Ex: 80"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-black mb-2">Redução</label>
                    <input
                      v-model="editingProduct!.reducao"
                      type="text"
                      placeholder="Ex: 5:1"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>
                </div>
              </div>

              <!-- Seção: Descrição -->
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Descrição
                </h4>
                <textarea
                  v-model="editingProduct!.description"
                  placeholder="Adicione uma descrição detalhada do produto..."
                  rows="4"
                  class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 resize-none"
                ></textarea>
              </div>

               <div>
                <input 
                  type="file" 
                  class="w-50% px-4 py-2.5 bg-emerald-950/50 border border-emerald-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all mb-3"
                  @change="(event) => handleFileInput(event)"
                >
              </div>

              <div class="">
              <h4 class="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Imagens
                </h4>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-black mb-2">
                      Imagens <span class="text-red-400">*</span>
                    </label>
                    
                    <!-- Input invisível -->
                    <input 
                      type="file" 
                      id="file-upload"
                      class="hidden"
                      @change="handleFileUpload"
                      accept="image/*"
                      multiple
                    />
                    
                    <!-- Label customizado que funciona como botão -->
                    <label 
                      for="file-upload"
                      class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all flex items-center justify-between"
                    >
                      <span class="text-black" v-if="!selectedFileName">
                        Clique para escolher imagens...
                      </span>
                      <span v-else class="text-white">
                        {{ selectedFileName }}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </label>
                  </div>

                  <div class="flex flex-col justify-between">
                    <div class="flex justify-end">
                      <div class="p-2 mr-auto">
                        <label class="block text-sm font-medium text-black mb-2 text-right">Situação</label>
                        <div class="flex items-center gap-3">
                          <span class="text-sm font-medium text-black">
                            {{ isActive ? 'Ativo' : 'Inativo' }}
                          </span>
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              v-model="isActive"
                              class="sr-only peer"
                            >
                            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Footer com botões bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg -->
            <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
              <div class="flex gap-3">
                <button
                  @click="isEditModalOpen = false"
                  class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="editProduct(editingProduct!), isEditModalOpen = false"
                  class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Salvar Produto
                </button>
              </div>
            </div>

          </div>
        </div>

        <div
          v-if="isProductDetailsOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black/60"
        >
          <div class="relative bg-gray-300 p-6 rounded-lg shadow-lg w-[95%] max-w-6xl h-[70%] max-h-[%70] p-20">

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

            <div class="grid grid-cols-2 gap-4">
        
            <!-- Coluna da esquerda: imagens -->
            <div class="flex flex-col h-[500px] w-full gap-4">
              
              <!-- Imagem principal -->
               <div class="flex-1 flex justify-start items-start rounded-lg p-2 min-h-0" >
                <img
                   :src="selectedImage || selectedImage.images[0]?.url"
                  alt="Imagem principal"
                  class="h-full max-h-full w-auto object-fill rounded transition-all duration-300"
                />
              </div>

              <!-- Miniaturas -->
               <div class="h-24 flex justify-start items-center gap-2">
                <img
                   v-for="(img, index) in selectedProduct.images"
                  :key="img.id || index"
                  :src="img.url"
                  alt="Miniatura"
                  class="h-20 w-auto object-contain rounded cursor-pointer transition-all border-2"
                  :class="selectedImage === img.url ? 'border-emerald-700' : 'border-transparent'"
                  @click="selectedImage = img.url"
                />
              </div>
              
            </div>

              
              <!-- Coluna do Formulário -->
              <div class="flex flex-col justify-start">
                <!-- Campos -->
                <div class="space-y-4">
                  
                  <div>
                    <h1 class="w-full font-fira text-emerald-900 text-3xl font-bold">Pé de Apoio {{ fetchedProduct?.capacidade_estatica }} Kg Acionamento {{ fetchedProduct?.tipoacionamento }} {{ fetchedProduct?.codigo }}</h1>
                  </div>

                  <div class="mt-10">
                      <h1 class="w-full font-fira text-gray-800 text-xl">{{ fetchedProduct?.description }}</h1>
                  </div>

                  <div class="mt-10 space-y-4">

                  <div>
                    <h1 class="w-full font-fira text-gray-800 text-xl"> <span class="font-semibold text-black">* Capacidade: </span>{{ fetchedProduct?.capacidade_estatica }} kg</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-800 text-xl"><span class="font-semibold text-black">* Base: </span>{{ fetchedProduct?.tipobase }}</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-800 text-xl"><span class="font-semibold text-black">* Bucha de fixação: </span>{{ fetchedProduct?.tipobucha }}</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-800 text-xl"><span class="font-semibold text-black">* Acionamento: </span>{{ fetchedProduct?.tipoacionamento }}</h1>
                  </div>

                  </div>



                </div>

            </div>

            </div>

            </div>

            <!-- -->

          </div>


        <div
          v-if="isAddModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4"
        >
          <div class="relative bg-neutral-200 rounded-4xl shadow-2xl w-full max-w-6xl max-h-[90vh]">
            
            
            <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-3xl font-bold text-black">Novo Produto</h3>
                </div>
                <button
                  @click="isAddModalOpen = false"
                  class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

           
            <div class="overflow-y-auto max-h-[calc(90vh-180px)] px-8 py-6">
              
              
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Informações Básicas
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Código <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="newProduct!.codigo"
                      type="text"
                      placeholder="Ex: RAL-1234"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <!-- Capacidade Estática -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Capacidade Estática (KG) <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="newProduct!.capacidade_estatica"
                      type="number"
                      placeholder="Ex: 5000"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Capacidade de Trabalho (KG) <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="newProduct!.capacidade_trabalho"
                      type="number"
                      placeholder="Ex: 2500"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>
                </div>
              </div>

             
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
                  </svg>
                  Componentes
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Acionamento <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <div class="flex gap-2">
                        <div class="relative flex-1">
                          <input
                            v-model="acionamentoSearchTerm"
                            type="text"
                            placeholder="Buscar ou selecionar"
                            class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 transition-all"
                            @focus="showAcionamentosDropdown = true"
                            @click.stop
                          />
                          <button
                            v-if="acionamentoSearchTerm"
                            @click="acionamentoSearchTerm = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors hover:cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button
                          @click="isAddAcionamentoModalOpen = true"
                          class="px-3 py-2.5 bg-white hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer"
                          title="Adicionar novo acionamento"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-black">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                      
                      <!-- Dropdown -->
                      <ul
                        v-if="showAcionamentosDropdown && filteredAcionamentos.length > 0"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-xl max-h-48 overflow-y-auto z-20"
                        @click.stop
                      >
                        <li
                          v-for="a in filteredAcionamentos"
                          :key="a.id"
                          @click="selectAcionamento(a)"
                          class="px-4 py-2.5 text-black hover:bg-gray-200 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {{ a.tipoacionamento }}
                        </li>
                      </ul>
                      <div v-if="showAcionamentosDropdown && filteredAcionamentos.length === 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg p-4 text-black text-sm text-center">
                        Nenhum acionamento encontrado
                      </div>
                    </div>
                  </div>

                  <!-- Bucha -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Bucha <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <div class="flex gap-2">
                        <div class="relative flex-1">
                          <input
                            v-model="buchaSearchTerm"
                            type="text"
                            placeholder="Buscar ou selecionar"
                            class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 transition-all"
                            @focus="showBuchasDropdown = true"
                            @click.stop
                          />
                          <button
                            v-if="buchaSearchTerm"
                            @click="buchaSearchTerm = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors hover:cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button
                          @click="isAddBuchaModalOpen = true"
                          class="px-3 py-2.5 bg-white hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer"
                          title="Adicionar nova bucha"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-black">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                      
                      <ul
                        v-if="showBuchasDropdown && filteredBuchas.length > 0"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-xl max-h-48 overflow-y-auto z-20"
                        @click.stop
                      >
                        <li
                          v-for="a in filteredBuchas"
                          :key="a.id"
                          @click="selectBucha(a)"
                          class="px-4 py-2.5 text-black hover:bg-gray-200 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {{ a.tipobucha }}
                        </li>
                      </ul>
                      <div v-if="showBuchasDropdown && filteredBuchas.length === 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg p-4 text-black text-sm text-center">
                        Nenhuma bucha encontrada
                      </div>
                    </div>
                  </div>

                  <!-- Base -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Base <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <div class="flex gap-2">
                        <div class="relative flex-1">
                          <input
                            v-model="baseSearchTerm"
                            type="text"
                            placeholder="Buscar ou selecionar"
                            class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 transition-all"
                            @focus="showBasesDropdown = true"
                            @click.stop
                          />
                          <button
                            v-if="baseSearchTerm"
                            @click="baseSearchTerm = ''"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors hover:cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button
                          @click="isAddBaseModalOpen = true"
                          class="px-3 py-2.5 bg-white hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer"
                          title="Adicionar nova base"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-black">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                      
                      <ul
                        v-if="showBasesDropdown && filteredBases.length > 0"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-xl max-h-48 overflow-y-auto z-20"
                        @click.stop
                      >
                        <li
                          v-for="a in filteredBases"
                          :key="a.id"
                          @click="selectBase(a)"
                          class="px-4 py-2.5 text-black hover:bg-gray-200 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {{ a.tipobase }}
                        </li>
                      </ul>
                      <div v-if="showBasesDropdown && filteredBases.length === 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg p-4 text-black text-sm text-center">
                        Nenhum acionamento encontrado
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Seção: Medidas -->
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                  </svg>
                  Medidas
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">Curso (mm)</label>
                    <input
                      v-model="newProduct!.curso"
                      type="number"
                      placeholder="Ex: 150"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-black mb-2">Altura da Bucha (mm)</label>
                    <input
                      v-model="newProduct!.altura_bucha"
                      type="number"
                      placeholder="Ex: 80"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-black mb-2">Redução</label>
                    <input
                      v-model="newProduct!.reducao"
                      type="text"
                      placeholder="Ex: 5:1"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>
                </div>
              </div>

              <!-- Seção: Descrição -->
              <div class="mb-6">
                <h4 class="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Descrição
                </h4>
                <textarea
                  v-model="newProduct!.description"
                  placeholder="Adicione uma descrição detalhada do produto..."
                  rows="4"
                  class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800 resize-none"
                ></textarea>
              </div>

               <div>
                <input 
                  type="file" 
                  class="w-50% px-4 py-2.5 bg-emerald-950/50 border border-emerald-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all mb-3"
                  @change="(event) => handleFileInput(event)"
                >
              </div>

              <div class="">
              <h4 class="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Imagens
                </h4>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-black mb-2">
                      Imagens <span class="text-red-400">*</span>
                    </label>
                    
                    <!-- Input invisível -->
                    <input 
                      type="file" 
                      id="file-upload"
                      class="hidden"
                      @change="handleFileUpload"
                      accept="image/*"
                      multiple
                    />
                    
                    <!-- Label customizado que funciona como botão -->
                    <label 
                      for="file-upload"
                      class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all flex items-center justify-between"
                    >
                      <span class="text-black" v-if="!selectedFileName">
                        Clique para escolher imagens...
                      </span>
                      <span v-else class="text-white">
                        {{ selectedFileName }}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </label>
                  </div>

                  <div class="flex flex-col justify-between">
                    <div class="flex justify-end">
                      <div class="p-2 mr-auto">
                        <label class="block text-sm font-medium text-black mb-2 text-right">Situação</label>
                        <div class="flex items-center gap-3">
                          <span class="text-sm font-medium text-black">
                            {{ isActive ? 'Ativo' : 'Inativo' }}
                          </span>
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              v-model="isActive"
                              class="sr-only peer"
                            >
                            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Footer com botões bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg -->
            <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
              <div class="flex gap-3">
                <button
                  @click="isAddModalOpen = false"
                  class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="addProduct(newProduct!), isAddModalOpen = false"
                  class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Salvar Produto
                </button>
              </div>
            </div>

          </div>
        </div>

    

    <div
      v-if="isAddBuchaModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
    >
      <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        <!-- Header do Modal -->
        <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-black">Nova Bucha</h3>
            </div>
            <button
              @click="isAddBuchaModalOpen = false"
              class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-black">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="px-6 py-6">
          <div>
            <label class="block text-sm font-medium text-black mb-2">
              Tipo da Bucha <span class="text-red-400">*</span>
            </label>
            <input
              v-model="newBucha!.tipobucha"
              type="text"
              placeholder="Ex: Bucha Cilíndrica"
              class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
            />
            <p v-if="errorMessageBucha" class="text-red-500 text-sm mt-1">{{ errorMessageBucha }}</p>
          </div>
        </div>

        <!-- Footer com botões -->
        <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
          <div class="flex gap-3">
            <button
              @click="isAddBuchaModalOpen = false"
              class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="addBucha(newBucha!)"
              class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Salvar
            </button>
          </div>
        </div>

      </div>
    </div>

    <div
      v-if="isAddBaseModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
    >
      <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        <!-- Header do Modal -->
        <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-black">Nova Base</h3>
            </div>
            <button
              @click="isAddBaseModalOpen = false"
              class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-black">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="px-6 py-6">
          <div>
            <label class="block text-sm font-medium text-black mb-2">
              Tipo da base <span class="text-red-400">*</span>
            </label>
            <input
              v-model="newBase!.tipobase"
              type="text"
              placeholder="Ex: Base quadrada"
              class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
            />
            <p v-if="errorMessageBase" class="text-red-500 text-sm mt-1">{{ errorMessageBase }}</p>
          </div>
        </div>

        <!-- Footer com botões -->
        <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
          <div class="flex gap-3">
            <button
              @click="isAddBaseModalOpen = false"
              class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="addBase(newBase!)"
              class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Salvar
            </button>
          </div>
        </div>

      </div>
    </div>



    <div
      v-if="isAddAcionamentoModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
    >
      <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        <!-- Header do Modal -->
        <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-black">Novo Acionamento</h3>
            </div>
            <button
              @click="isAddAcionamentoModalOpen = false"
              class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-black">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="px-6 py-6">
          <div>
            <label class="block text-sm font-medium text-black mb-2">
              Tipo do Acionamento <span class="text-red-400">*</span>
            </label>
            <input
              v-model="newAcionamento!.tipoacionamento"
              type="text"
              placeholder="Ex: Acionamento Lateral"
              class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
            />
            <p v-if="errorMessageAcionamento" class="text-red-500 text-sm mt-1">{{ errorMessageAcionamento }}</p>
          </div>
        </div>

        <!-- Footer com botões -->
        <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
          <div class="flex gap-3">
            <button
              @click="isAddAcionamentoModalOpen = false"
              class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="addAcionamento(newAcionamento!)"
              class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Salvar
            </button>
          </div>
        </div>

      </div>
    </div>


        <!-- Repita o card ou use v-for -->
        
      </div>

     <footer class="bg-white dark:bg-emerald-950 text-black dark:text-white w-full mt-10">
        <div class="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center space-y-6">
          <!-- Logo -->
          <img src="../../../../../imgstorage/logo/logorobusteccinza.png" alt="Logo" class="h-16">

          <!-- Links -->
          <nav class="flex flex-col items-center gap-2 text-center">
            <h1 class="text-lime-500">Robustec Indústria e Comércio Ltda</h1>
            <h1 class="">ERS 324, Km 75 Linha Anita Garibaldi,</h1>
            <h1 class="">Vila Maria RS, CEP 99155-000</h1>
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

    
    <!-- Fim footer-->
  </main>
</template>

<style>
.paginationBack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pagination{
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}


.btnPagination {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  border-radius: 8px;
}

.btnPagination:hover{
  cursor: pointer;
}
</style>