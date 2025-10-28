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


export default defineComponent({
  setup() {

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

    onMounted(async () => {
      products.value = await fetchProducts();
      acionamentos.value = await fetchAcionamentos();
      buchas.value = await fetchBuchas();
      bases.value = await fetchBases();
      document.addEventListener("click", handleClickOutside);
    });

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

    const addBucha = async (newBucha: Bucha) => {

      isAddBuchaModalOpen.value = true;

      console.log(newProduct, "antes de chamar create bucha");
      if (newBucha) {
        await createBucha(newBucha);
        console.log(newBucha, "depois de chamar create bucha")
        isAddModalOpen.value = false // fecha modal/edição
      }
    };

    const addAcionamento = async (newAcionamento: Acionamento) => {

      isAddAcionamentoModalOpen.value = true;

      console.log(newProduct, "antes de chamar create acionamento");
      if (newAcionamento) {
        await createAcionamento(newAcionamento);
        console.log(newAcionamento, "depois de chamar create acionamento")
        isAddModalOpen.value = false // fecha modal/edição
      }
    };

    const addBase = async (newBase: Base) => {

      isAddBaseModalOpen.value = true;
      console.log(newProduct, "antes de chamar create base");
      if (newBase) {
        await createBase(newBase);
        console.log(newBase, "depois de chamar create base")
        isAddModalOpen.value = false // fecha modal/edição
      }
    };

      const addOptions = ref([
      { label: "Produtos", action: openAddModal },
      { label: "Buchas", action: addBucha },
      { label: "Acionamentos", action: addAcionamento },
      { label: "Bases", action: addBase },
    ]);

    function openEditModal(product: Product) {
      editingProduct.value = {
        ...product,
        tipoacionamento: acionamentoMap.value[product.id_acionamento] || "Desconhecido",
        tipobucha: buchaMap.value[product.id_bucha] || "Desconhecido",
        tipobase: baseMap.value[product.id_base] || "Desconhecido",
      };
      isEditModalOpen.value = true
    }

    function openAddModal() {
      isAddModalOpen.value = true
    }

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

    onMounted(async () => {
      
      products.value = await productsWithParams({page: page.value,  limit: limit.value})
    });

    const filterWithParamsHandler = async () => {
      try {
        loading.value = true;

        const response = await filterWithParams({
          tipo_bucha: filterBucha.value,
          tipoacionamento: filterAcionamento.value,
          tipobase: filterBase.value,
          page: 1,
          limit: 10
        })

        if (response.products_with_params) {
          products.value = response.products_with_params  
        } else {
          console.log('no products found');
          
        }

        console.log(products.value);
        
      } catch (error) {
        console.log(error);
        
      } finally {
        loading.value = false;
      }
    }
   

    return {
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
      filterBase
    };
  },
});
</script>

<template>
  
  <main class="flex min-h-screen bg-gradient-to-b from-orange-200 to-orange-850 text-emerald-950 dark:from-gray-300 dark:to-gray-400 dark:text-slate-100">
    
    <div class="flex flex-col items-center w-full">

      <header class="bg-emerald-900 w-full h-26 flex justify-between">

      <div class="w-1/2">

        <img src="../../../../../imgstorage/logo/robustec.jpg" alt="" class="w-full h-full object-contain pb-2 ml-auto">

      </div>

      <div class="w-2/5 flex justify-end items-center gap-8 text-white mr-auto">

        <h1 class="">Produtos</h1>

        <div ref="menuRef" class="relative inline-block text-left">

          <button
            @click="toggleAddMenu"
            class="hover:cursor-pointer"
          >
            Adicionar
          </button>

          <!-- Dropdown -->
          <div
            v-if="isAdicionarOpen"
            class="absolute left-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
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

        <button class="bg-emerald-950 b-10 p-2 rounded-lg border-black hover:cursor-pointer hover:bg-stone-700">Logout</button>

      </div>

    </header>

      <!-- título -->
      <div class="flex justify-between items-center m-10 gap-x-20"> 

        <div class="flex justify-start mt-10" >
          <h2 class="mb-10 text-3xl font-bold text-center text-neutral-950">Lista de Produtos</h2>
          <div class="text-center">
          <input
            v-model="search"
            @input="onSearch"
            type="text"
            placeholder="Buscar produto por código..."
            class="ml-5 p-3 rounded-lg w-80 bg-white text-black font-bold mb-7"
          >
          </input>
  </div>
        </div>

        <div class="flex justify-end">
          <button class="b-10 p-2 h-12 bg-emerald-900 text-white-900 rounded-sm hover:cursor-pointer hover:bg-emerald-700 flex space-x-2 gap-2" @click="openAddModal()">

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>

          
          Adicionar Produto</button>
        </div>

      </div>
        
      <div class="flex flex-row mb-15 text-black text-lg gap-8">
        <select class="select select-md select-ghost" v-model="filterBucha">
          <option disabled value="">Tipo da bucha</option>
          <option v-for="bucha in filteredBuchas">{{ bucha.tipobucha }}</option>
        </select>
       
        

        <select class="select select-md select-ghost" v-model="filterAcionamento">
          <option disable value="">Tipo do acionamento</option>
          <option v-for="acionamento in filteredAcionamentos">{{ acionamento.tipoacionamento }}</option>
        </select>

        <select class="select select-md select-ghost" v-model="filterBase">
          <option disable value="">Tipo da base</option>
          <option v-for="base in filteredBases">{{ base.tipobase }}</option>
        </select>

        <button @click="filterWithParamsHandler" class="flex p-2 hover:text-bold hover:bg-gray-500 hover:border-radius-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 376 384" class="mr-2"><path fill="#000000" d="m267 235l106 106l-32 32l-106-106v-17l-6-6q-39 33-90 33q-58 0-98.5-40.5T0 138.5t40.5-98t98-40.5t98 40.5T277 139q0 51-33 90l6 6h17zm-128 0q40 0 68-28t28-68t-28-68t-68-28t-68 28t-28 68t28 68t68 28z"/></svg>
        Filtrar</button>
      </div>

      <!-- grid -->
      <div id="produtos-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center  max-w-7xl">
        
        <div v-for="product in produtosCompletos" :key="product.id"
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="font-fira text-emerald-800 text-sm">Novo</h1>
              <h1 class="font-fira text-zinc-800 text-xl font-semibold">Pé de Apoio {{ product.capacidade_estatica }} Kg Acionamento {{ product.tipoacionamento }}</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="font-fira text-zinc-800 text-sm">Código</h1>
              <div class="flex space-x-3">
                <h1 class="font-fira text-zinc-700 font-bold text-2xl">{{ product.codigo }}</h1>
                <!-- Botões de edição e exclusão -->
                <div class="flex ml-auto">
                    <div class="relative group flex items-center justify-center">
                      <button class="b-10 p-1 bg-emerald-900 text-white-900 rounded-sm hover:cursor-pointer hover:bg-emerald-700" @click="openEditModal(product)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 p-0.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>

                      </button>

                       <span class="font-fira absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2">
                        Editar
                      </span>
                  </div>
                </div>
                <div>
                    <div class="relative group flex items-center justify-center">
                      <button class="b-10 p-1 bg-red-900 text-white-900 rounded-sm hover:cursor-pointer hover:bg-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6" @click="deleteProduct(product.id)">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>

                      </button>
                      <span class="font-fira absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2">
                        Remover
                      </span>
                  </div>
                </div>
                <!-- Botões de edição e exclusão -->
              </div>
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

        <!-- Modal editar -->
        <div
          v-if="isEditModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black/60"
        >
          <div class="bg-emerald-900 p-6 rounded-lg shadow-lg w-[95%] max-w-4xl">
            <h3 class="text-lg font-semibold mb-4 text-white">Editar Produto</h3>

            <!-- Grid responsiva -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div class="mb-3">
                <label class="block text-sm font-medium text-white">Código</label>
                <input
                  v-model="editingProduct!.codigo"
                  type="text"
                  class="w-full border rounded px-2 py-1 bg-emerald-950"
                />
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-white">Descrição</label>
                <input
                  v-model="editingProduct!.description"
                  type="text"
                  class="w-full border rounded px-2 py-1 bg-emerald-950"
                />
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-white">Capacidade Estática (KG)</label>
                <input
                  v-model="editingProduct!.capacidade_estatica"
                  type="number"
                  class="w-full border rounded px-2 py-1 bg-emerald-950"
                />
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-white">Capacidade de Trabalho (KG)</label>
                <input
                  v-model="editingProduct!.capacidade_trabalho"
                  type="number"
                  class="w-full border rounded px-2 py-1 bg-emerald-950"
                />
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-white">Redução</label>
                <input
                  v-model="editingProduct!.reducao"
                  type="text"
                  class="w-full border rounded px-2 py-1 bg-emerald-950"
                />
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-white">Altura da bucha (mm)</label>
                <input
                  v-model="editingProduct!.altura_bucha"
                  type="number"
                  class="w-full border rounded px-2 py-1 bg-emerald-950"
                />
              </div>

              <!-- Selecionar bucha -->
             <div class="flex flex-col gap-0.5 items-strech">
              <h1 class="block text-sm font-medium mb-1">Bucha</h1>
              <div class="flex items-center border rounded bg-emerald-950 relative"> 
                <input
                  v-model="buchaSearchTerm"
                  type="text"
                  class="flex-1 px-2 py-1 bg-emerald-950 text-white outline-none rounded-l"
                  @focus="showBuchasDropdown = true"
                  @click.stop
                />

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="buchaSearchTerm = '' "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 stroke-current text-red-700">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>

                </button>

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="isAddBuchaModalOpen = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>

                <ul
                  v-if="showBuchasDropdown"
                  class="absolute top-full left-0 w-full bg-emerald-900 border border-emerald-700 rounded mt-1 max-h-48 overflow-y-auto z-10"
                  @click.stop
                >
                  <li
                    v-for="a in filteredBuchas"
                    :key="a.id"
                    @mousedown.prevent="selectBucha(a)"
                    @click="selectBucha(a)"
                    class="px-3 py-1 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {{ a.tipobucha }}
                  </li>
                  <li
                    v-if="filteredBuchas.length === 0"
                    class="px-3 py-1 text-gray-300 italic"
                  >
                    Nenhuma bucha encontrada
                  </li>
                </ul>

              </div>
            </div>

              <!-- Selecionar base -->
             <div class="flex flex-col gap-0.5 items-strech">
              <h1 class="block text-sm font-medium mb-1">Base</h1>
              <div class="flex items-center border rounded bg-emerald-950 relative"> 
                <input
                  v-model="baseSearchTerm"
                  type="text"
                  class="flex-1 px-2 py-1 bg-emerald-950 text-white outline-none rounded-l"
                  @focus="showBasesDropdown = true"
                  @click.stop
                />

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="baseSearchTerm = '' "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 stroke-current text-red-700">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>

                </button>

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="isAddBaseModalOpen = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>

                <ul
                  v-if="showBasesDropdown"
                  class="absolute top-full left-0 w-full bg-emerald-900 border border-emerald-700 rounded mt-1 max-h-48 overflow-y-auto z-10"
                  @click.stop
                >
                  <li
                    v-for="a in filteredBases"
                    :key="a.id"
                    @mousedown.prevent="selectBase(a)"
                    @click="selectBase(a)"
                    class="px-3 py-1 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {{ a.tipobase }}
                  </li>
                  <li
                    v-if="filteredBases.length === 0"
                    class="px-3 py-1 text-gray-300 italic"
                  >
                    Nenhuma base encontrada
                  </li>
                </ul>

              </div>
            </div>

               <!-- Selecionar acionamento -->
             <div class="flex flex-col gap-0.5 items-strech">
              <h1 class="block text-sm font-medium mb-1">Acionamento</h1>
              <div class="flex items-center border rounded bg-emerald-950 relative"> 
                <input
                  v-model="acionamentoSearchTerm"
                  type="text"
                  class="flex-1 px-2 py-1 bg-emerald-950 text-white outline-none rounded-l"
                  @focus="showAcionamentosDropdown = true"
                  @click.stop
                />

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="acionamentoSearchTerm = '' "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 stroke-current text-red-700">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>

                </button>

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="isAddAcionamentoModalOpen = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>

                <ul
                  v-if="showAcionamentosDropdown"
                  class="absolute top-full left-0 w-full bg-emerald-900 border border-emerald-700 rounded mt-1 max-h-48 overflow-y-auto z-10"
                  @click.stop
                >
                  <li
                    v-for="a in filteredAcionamentos"
                    :key="a.id"
                    @mousedown.prevent="selectAcionamento(a)"
                    @click="selectAcionamento(a)"
                    class="px-3 py-1 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {{ a.tipoacionamento }}
                  </li>
                  <li
                    v-if="filteredAcionamentos.length === 0"
                    class="px-3 py-1 text-gray-300 italic"
                  >
                    Nenhum acionamento encontrado
                  </li>
                </ul>

              </div>
            </div>
            </div>

            <!-- Campo isolado -->
            <div class="mb-3 mt-4">
              <label class="block text-sm font-medium text-white">Curso (mm)</label>
              <input
                v-model="editingProduct!.curso"
                type="number"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>

            <!-- Botões -->
            <div class="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <button
                @click="isEditModalOpen = false"
                class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black hover:cursor-pointer"
              >
                Cancelar
              </button>
              <button
                @click="editProduct(editingProduct), isEditModalOpen = false"
                class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 hover:cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="isProductDetailsOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black/60"
        >
          <div class="bg-gray-300 p-6 rounded-lg shadow-lg w-[95%] max-w-5xl h-[90%] max-h-[%90] p-20">

            <!-- Grid responsiva -->
            <div class="grid grid-cols-2 gap-4">
              
              <div class="grid grid-rows-2 h-[90%] w-full gap-4">
                <!-- Imagem de cima (50%) -->
                <div class="h-full flex justify-start">
                <img src="../../../../../imgstorage/testes/ral.jpg" 
                    alt="" 
                    class="h-full object-fill rounded" />
              </div>
                <!-- Parte de baixo (50%) -->
                <div class="grid grid-cols-3 gap-4 h-full w-4/5">
                  <img src="../../../../../imgstorage/testes/ral.jpg" 
                      alt="" 
                      class="w-full h-auto object-contain rounded" />
                  <img src="../../../../../imgstorage/testes/ral2.jpg" 
                      alt="" 
                      class="w-full h-auto object-contain rounded" />
                  <img src="../../../../../imgstorage/testes/ral3.jpg" 
                      alt="" 
                      class="w-full h-auto  object-contain rounded"/>
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
                    <h1 class="w-full font-fira text-gray-600 text-md">* Capacidade: {{ fetchedProduct?.capacidade_estatica }} kg</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-600 text-md">* Base: {{ fetchedProduct?.tipobase }}</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-600 text-md">* Bucha de fixação: {{ fetchedProduct?.tipobucha }}</h1>
                  </div>

                  <div>
                    <h1 class="w-full font-fira text-gray-600 text-md">* Acionamento: {{ fetchedProduct?.tipoacionamento }}</h1>
                  </div>

                  </div>



                </div>

                <!-- Botões -->
                <div class="flex justify-end gap-3 mt-6">
                  <button @click="isProductDetailsOpen = false"
                          class="px-5 py-2 rounded-lg bg-gray-400 text-black font-semibold hover:bg-gray-500 hover:cursor-pointer shadow">
                    Sair
                  </button>
                </div>

            </div>

            </div>

            </div>

            <!-- -->

          </div>


        <div
      v-if="isAddModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-opacity-20 bg-black/60"
    >
      <div class="bg-emerald-900 p-6 rounded-lg shadow-lg w-[95%] max-w-4xl w-1/2">
        <h3 class="text-lg font-semibold mb-4">Adicionar Produto</h3>

        <!-- Container do formulário -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Coluna 1 -->
          <div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Código</label>
              <input
                v-model="newProduct!.codigo"
                type="text"
                placeholder="Insira o código do produto"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>

            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Descrição</label>
              <input
                v-model="newProduct!.description"
                type="text"
                placeholder="Insira a descrição do produto"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>

            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Capacidade Estática (KG)</label>
              <input
                v-model="newProduct!.capacidade_estatica"
                type="number"
                placeholder="Insira a capacidade estática do produto"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>
          </div>

          <!-- Coluna 2 -->
          <div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Capacidade de Trabalho (KG)</label>
              <input
                v-model="newProduct!.capacidade_trabalho"
                type="number"
                placeholder="Insira a capacidade de trabalho do produto"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>

            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Redução</label>
              <input
                v-model="newProduct!.reducao"
                type="text"
                placeholder="Insira a redução do produto"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>

            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Altura da Bucha (mm)</label>
              <input
                v-model="newProduct!.altura_bucha"
                type="number"
                placeholder="Insira a altura da bucha"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>
          </div>

          <!-- Coluna 3 -->
          <div class="flex flex-col gap-1">
            <div class="flex flex-col gap-0.5 items-strech">
              <h1 class="block text-sm font-medium mb-1">Acionamento</h1>
              <div class="flex items-center border rounded bg-emerald-950 relative"> 
                <input
                  v-model="acionamentoSearchTerm"
                  type="text"
                  placeholder="Escolha o acionamento"
                  class="flex-1 px-2 py-1 bg-emerald-950 text-white outline-none rounded-l"
                  @focus="showAcionamentosDropdown = true"
                  @click.stop
                />

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="isAddAcionamentoModalOpen = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>

                <ul
                  v-if="showAcionamentosDropdown"
                  class="absolute top-full left-0 w-full bg-emerald-900 border border-emerald-700 rounded mt-1 max-h-48 overflow-y-auto z-10"
                  @click.stop
                >
                  <li
                    v-for="a in filteredAcionamentos"
                    :key="a.id"
                    @mousedown.prevent="selectAcionamento(a)"
                    @click="selectAcionamento(a)"
                    class="px-3 py-1 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {{ a.tipoacionamento }}
                  </li>
                  <li
                    v-if="filteredAcionamentos.length === 0"
                    class="px-3 py-1 text-gray-300 italic"
                  >
                    Nenhum acionamento encontrado
                  </li>
                </ul>

              </div>
            </div>

            <!-- Selecionar bucha -->
             <div class="flex flex-col gap-0.5 items-strech">
              <h1 class="block text-sm font-medium mb-1">Bucha</h1>
              <div class="flex items-center border rounded bg-emerald-950 relative"> 
                <input
                  v-model="buchaSearchTerm"
                  type="text"
                  placeholder="Escolha a bucha"
                  class="flex-1 px-2 py-1 bg-emerald-950 text-white outline-none rounded-l"
                  @focus="showBuchasDropdown = true"
                  @click.stop
                />

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="isAddBuchaModalOpen = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>

                <ul
                  v-if="showBuchasDropdown"
                  class="absolute top-full left-0 w-full bg-emerald-900 border border-emerald-700 rounded mt-1 max-h-48 overflow-y-auto z-10"
                  @click.stop
                >
                  <li
                    v-for="a in filteredBuchas"
                    :key="a.id"
                    @mousedown.prevent="selectBucha(a)"
                    @click="selectBucha(a)"
                    class="px-3 py-1 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {{ a.tipobucha }}
                  </li>
                  <li
                    v-if="filteredBuchas.length === 0"
                    class="px-3 py-1 text-gray-300 italic"
                  >
                    Nenhuma bucha encontrado
                  </li>
                </ul>

              </div>
            </div>

             <div class="flex flex-col gap-0.5 items-strech">
              <h1 class="block text-sm font-medium mb-1">Base</h1>
              <div class="flex items-center border rounded bg-emerald-950 relative"> 
                <input
                  v-model="baseSearchTerm"
                  type="text"
                  placeholder="Escolha a base"
                  class="flex-1 px-2 py-1 bg-emerald-950 text-white outline-none rounded-l"
                  @focus="showBasesDropdown = true"
                  @click.stop
                />

                <button
                  class="p-2 text-white hover:bg-emerald-800 rounded-r transition hover:cursor-pointer" @click="isAddBaseModalOpen = true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>

                <ul
                  v-if="showBasesDropdown"
                  class="absolute top-full left-0 w-full bg-emerald-900 border border-emerald-700 rounded mt-1 max-h-48 overflow-y-auto z-10"
                  @click.stop
                >
                  <li
                    v-for="a in filteredBases"
                    :key="a.id"
                    @mousedown.prevent="selectBase(a)"
                    @click="selectBase(a)"
                    class="px-3 py-1 text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {{ a.tipobase }}
                  </li>
                  <li
                    v-if="filteredBases.length === 0"
                    class="px-3 py-1 text-gray-300 italic"
                  >
                    Nenhuma base encontrado
                  </li>
                </ul>

              </div>
            </div>


          </div>
        </div>

        <!-- Linha inferior com curso + botões -->
        <div class="grid grid-cols-2 items-center mt-4">
          <!-- Campo curso à esquerda -->
          <div>
            <label class="block text-sm font-medium mb-1">Curso (mm)</label>
            <input
              v-model="newProduct!.curso"
              type="number"
              placeholder="Insira o curso do produto"
              class="w-full border rounded px-2 py-1 bg-emerald-950"
            />
          </div>

          <!-- Botões à direita -->
          <div class="flex justify-end gap-2 self-end">
            <button
              @click="isAddModalOpen = false"
              class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="addProduct(newProduct!), isAddModalOpen = false"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 hover:cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>

    

    <div
      v-if="isAddBuchaModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-opacity-20 bg-black/60"
    >
      <div class="bg-emerald-900 p-6 rounded-lg shadow-lg w-[95%] max-w-4xl w-1/2">
        <h3 class="text-lg font-semibold mb-4">Adicionar Bucha</h3>

        <!-- Container do formulário -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Coluna 1 -->
          <div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Bucha</label>
              <input
                v-model="newBucha!.tipobucha"
                type="text"
                placeholder="Insira o tipo de bucha"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>
          </div>
        </div>

        <!-- Linha inferior com curso + botões -->
        <div class="grid grid-cols-2 items-center mt-4">
          <!-- Botões à direita -->
          <div class="flex justify-end gap-2 self-end">
            <button
              @click="isAddBuchaModalOpen = false"
              class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="addBucha(newBucha!), isAddBuchaModalOpen = false"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 hover:cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>


    <div
      v-if="isAddBaseModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-opacity-20 bg-black/60"
    >
      <div class="bg-emerald-900 p-6 rounded-lg shadow-lg w-[95%] max-w-4xl w-1/2">
        <h3 class="text-lg font-semibold mb-4">Adicionar Base</h3>

        <!-- Container do formulário -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Coluna 1 -->
          <div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Base</label>
              <input
                v-model="newBase!.tipobase"
                type="text"
                placeholder="Insira o tipo de base"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>
          </div>
        </div>

        <!-- Linha inferior com curso + botões -->
        <div class="grid grid-cols-2 items-center mt-4">
          <!-- Botões à direita -->
          <div class="flex justify-end gap-2 self-end">
            <button
              @click="isAddBaseModalOpen = false"
              class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="addBucha(newBase!), isAddBaseModalOpen = false"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 hover:cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>



    <div
      v-if="isAddAcionamentoModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-opacity-20 bg-black/60"
    >
      <div class="bg-emerald-900 p-6 rounded-lg shadow-lg w-[95%] max-w-4xl w-1/2">
        <h3 class="text-lg font-semibold mb-4">Adicionar Acionamento</h3>

        <!-- Container do formulário -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Coluna 1 -->
          <div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Acionamento</label>
              <input
                v-model="newAcionamento!.tipoacionamento"
                type="text"
                placeholder="Insira o tipo de acionamento"
                class="w-full border rounded px-2 py-1 bg-emerald-950"
              />
            </div>
          </div>
        </div>

        <!-- Linha inferior com curso + botões -->
        <div class="grid grid-cols-2 items-center mt-4">
          <!-- Botões à direita -->
          <div class="flex justify-end gap-2 self-end">
            <button
              @click="isAddAcionamentoModalOpen = false"
              class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="addBucha(newAcionamento!), isAddAcionamentoModalOpen = false"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 hover:cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>


        <!-- Repita o card ou use v-for -->
        
      </div>

      <div class="bg-zinc-500 w-full h-120 m-10">

        <div class="flex space-x-2 justify-between m-25">

          <div class="">
            <h1 class="text-3xl font-semibold font-sans-serif">Fale conosco</h1>
          </div>

          <div class="bg-white w-1/2 h-80 mb-5 rounded-xl p-10 shadow-xl">

            <form action="">
              <label for="" class="font-fira text-black text-xl">
                Nome
              </label>
              <input
                  placeholder="John Doe"
                  class="w-full rounded-xl border border-black bg-white px-3 py-2 mt-2 mb-5 text-sm 
                  shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-black 
                  dark:border-black dark:bg-orange-950/60 dark:focus:border-black dark:focus:rin"
                />
              <label for="" class="font-fira text-black text-xl">
                Email
              </label>
              <input
                  placeholder="voce@exemplo.com"
                  class="w-full rounded-xl border border-black bg-white px-3 py-2 mt-2 mb-5 text-sm 
                  shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-black 
                  dark:border-black dark:bg-orange-950/60 dark:focus:border-black dark:focus:rin"
                />
                <button class="font-fira bg-emerald-700 w-full py-3 rounded-lg hover:bg-emerald-600 hover:cursor-pointer text-white font-bold text-lg">Enviar</button>
            </form>

          </div>

        </div>

      </div>

      <footer class="bg-white dark:bg-emerald-950 text-black dark:text-white w-full">
        <div class="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center space-y-6">
          <!-- Logo -->
          <img src="../../../../../imgstorage/logo/robusteclogo.png" alt="Logo" class="h-20">

          <!-- Links -->
           <h1 class="text-lime-500 font-fira">Robustec Indústria e Comércio Ltda</h1>
          <nav class="flex flex-wrap justify-center gap-6 text-base">
            <a href="#" class="font-fira hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="font-fira hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="font-fira hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="font-fira hover:text-green-900 hover:underline">XXX</a>
            <a href="#" class="font-fira hover:text-green-900 hover:underline">XXX</a>
          </nav>

          <!-- Redes sociais -->
          <div class="flex space-x-5">
            <a target="_blank" href="https://www.instagram.com/robustec_ltda" class="hover:text-pink-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-instagram h-10 w-10" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                  </svg>
            </a>
            <a target="_blank" href="https://web.facebook.com/Robustec.ltda" class="hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-facebook h-10 w-10" viewBox="0 0 16 16">
                        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                      </svg> 
            </a>
            <a target="_blank" href="https://api.whatsapp.com/send/?phone=5433592200&text&type=phone_number&app_absent=0" class="hover:text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp h-10 w-10" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.876 7.876 0 0 0 8.004 0C3.584 0 .016 3.566.016 7.986c0 1.409.368 2.781 1.07 3.986L0 16l4.134-1.067a7.951 7.951 0 0 0 3.87.986h.004c4.42 0 7.988-3.566 7.988-7.986a7.9 7.9 0 0 0-2.395-5.593m-5.597 12.02a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.463.635.657-2.396-.156-.247a6.574 6.574 0 0 1-1.02-3.548c0-3.634 2.961-6.597 6.6-6.597a6.56 6.56 0 0 1 4.674 1.938 6.53 6.53 0 0 1 1.928 4.659c0 3.635-2.961 6.596-6.624 6.619m3.62-4.941c-.197-.099-1.17-.578-1.351-.645-.181-.066-.314-.099-.446.099s-.512.644-.628.775c-.116.132-.232.149-.43.05s-.837-.308-1.594-.983c-.59-.526-.987-1.175-1.103-1.373-.116-.198-.012-.304.087-.402.089"/>
            </svg>

            </a>
          </div>

          <!-- Linha divisória -->
          <hr class="w-full border-t border-gray-300 dark:border-gray-600">

          <!-- Direitos -->
          <div class="flex flex-col sm:flex-row justify-between items-center w-full text-sm">
            <p>&copy; 2025 - Robustec. 
              <a href="https://www.robustec.ind.br/termos-de-uso" class="hover:underline"> Termos e Condições</a>
            </p>
            <p>
              <a href="https://www.robustec.ind.br/politica-de-privacidade" class="hover:underline">Privacidade</a> | 
              <a href="https://www.robustec.ind.br/trabalhe-conosco/" class="hover:underline">Trabalhe conosco</a>
            </p>
          </div>
        </div>
      </footer>

    </div>

    
    <!-- Fim footer-->
  </main>
</template>