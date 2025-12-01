<script lang="ts">
import { defineComponent, ref, onMounted, computed, onUnmounted } from "vue";
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
import { getClaims } from "../../../services/jwt_decoder";


export default defineComponent({
  setup() {

    const router = useRouter();
    const products = ref<ProductWithComponents[]>([]);
    const total = ref(0);
    const page = ref(1)
    const limit = ref(10);
    const isLoading = ref(true);
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

     const showUserManagment = ref(false);

    const checkUserGroup = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 3) {
        showUserManagment.value = true;
      } 

    };

    const getEmail = ref("")
    const menuOpen = ref(false);

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


    const images = ref([
      "../../../../imgstorage/testes/ral.jpg",
      "../../../../imgstorage/testes/ral2.jpg",
      "../../../../imgstorage/testes/ral3.jpg",
    ]);
    

    const productsWithParams = async (options = {}): Promise<ProductWithComponents[]> => {
      try {
        const data = await withParams({
          page: 1,
          limit: 10,
          ...options
        });

        console.log('📦 data.total:', data.total);

        const sortedProducts = (data.products_with_params || [])
        .filter(p => p.ativo === true) // ← FILTRA APENAS ATIVOS
        .sort((a, b) => b.id - a.id);
        
        // Atualiza os valores
        products.value = sortedProducts
        page.value = data.page
        limit.value = data.limit

        // Retorna os produtos para que o chamador decida o que fazer
        return sortedProducts || []

      } catch (err) {
        console.log("Erro ao listar com parâmetros, ", err)
        return [] // Retorna array vazio em vez de throw
      } 
    }

    const onSearch = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(async () => {
        try {
          isLoading.value = true;
          const data = await productsWithParams({ search: search.value });
          products.value = data;
        } catch (error) {
          console.error('Erro na busca:', error);
          products.value = [];
        } finally {
          isLoading.value = false;
        }
      }, 400);
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

    const selectedImage = ref<string>('');
    const selectedProduct = ref<Product | null>(null);

    const isProductDetailsOpen = ref (false);

    const isLoadingDetails = ref(false);

    const showProductDetails = async (p: Product) => {

      console.log('🔵 showProductDetails - produto:', p);
      console.log('🔵 Imagens do produto:', p.images);

      selectedProduct.value = p;
  
  // Define a primeira imagem como selecionada
      if (p.images && p.images.length > 0) {
        selectedImage.value = p.images[0]?.url || '';
        console.log('✅ selectedImage definido:', selectedImage.value);
      } else {
        selectedImage.value = '';
        console.log('⚠️ Produto sem imagens');
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

        if (fetchedProduct.value.images && fetchedProduct.value.images.length > 0) {
          console.log('📸 Atualizando com imagens do fetchById');
          selectedProduct.value = fetchedProduct.value;
          if (!selectedImage.value) {
            selectedImage.value = fetchedProduct.value.images[0].url;
          }
        }

        isProductDetailsOpen.value = true;

      } catch (error) {
        console.error('❌ Erro ao carregar detalhes:', error);
        alert('Erro ao carregar os detalhes do produto. Tente novamente.');
      } finally {
        isLoadingDetails.value = false;
      }
    };

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

    const redirectToUserManagment = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 3) {
          await router.push({path: '/admin/users'})
        } else {
          router.push({path: '/'})
        }

    };

    const clearFilters = async () => {
      filterBucha.value = "";
      filterAcionamento.value = "";
      filterBase.value = "";
      await productsWithParams({ page: page.value, limit: limit.value });
    };

    const clearAllFilters = () => {
      search.value = '';
      filterBucha.value = '';
      filterAcionamento.value = '';
      filterBase.value = '';
      productsWithParams({ page: page.value, limit: limit.value });
    };


    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }

    const paginateAhead = async () => {
      try {
        isLoading.value = true
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
        isLoading.value = false
      }
    }

    const paginateReturn = async () => {
      try {
        isLoading.value = true
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
        isLoading.value = false
      }
    }

    const produtosCompletos = computed(() =>
      products.value.map(p => ({
        ...p,
        tipoacionamento: acionamentoMap.value[p.id_acionamento] || 'Desconhecido',
        tipobucha: buchaMap.value[p.id_bucha] || 'Desconhecido',
        tipobase: baseMap.value[p.id_base] || 'Desconhecido',
      }))
    );

    const currentImageIndex = ref<{ [key: number]: number }>({});

    // Função para navegar para a próxima imagem
    const nextImage = (productId: number, totalImages: number) => {
      if (!currentImageIndex.value[productId]) {
        currentImageIndex.value[productId] = 0;
      }
      currentImageIndex.value[productId] = (currentImageIndex.value[productId] + 1) % totalImages;
    };

    // Função para navegar para a imagem anterior
    const previousImage = (productId: number, totalImages: number) => {
      if (!currentImageIndex.value[productId]) {
        currentImageIndex.value[productId] = 0;
      }
      currentImageIndex.value[productId] = 
        currentImageIndex.value[productId] === 0 
          ? totalImages - 1 
          : currentImageIndex.value[productId] - 1;
    };

    // Função para ir direto para uma imagem específica (bolinhas indicadoras)
    const goToImage = (productId: number, index: number) => {
      currentImageIndex.value[productId] = index;
    };

    const isImageZoomApplied = ref(false);

    // Computed para pegar as imagens do produto nos detalhes
    const detailsImages = computed(() => {
      if (!selectedProduct.value?.images) {
        console.log('⚠️ selectedProduct sem imagens');
        return [];
      }
      console.log('✅ detailsImages:', selectedProduct.value.images.length, 'imagens');
      return selectedProduct.value.images;
    });

    // Índice da imagem atual NO ZOOM
    const detailsImageIndex = ref(0);

    // Abre o zoom
    const applySelectedImageZoom = () => {
      isImageZoomApplied.value = true;
      document.body.style.overflow = 'hidden';
    };

    // Fecha o zoom
    const closeZoom = () => {
      isImageZoomApplied.value = false;
      document.body.style.overflow = '';
    };

    // Navega para a imagem anterior NO ZOOM
    const previousZoomImage = () => {
      const images = detailsImages.value;
      if (images.length <= 1) return;
      
      detailsImageIndex.value--; // ← ADICIONE ESTA LINHA
      if (detailsImageIndex.value < 0) {
        detailsImageIndex.value = images.length - 1;
      }
      selectedImage.value = images[detailsImageIndex.value].url;
    };

    // Navega para a próxima imagem NO ZOOM
    const nextZoomImage = () => {
      const images = detailsImages.value;
      if (images.length <= 1) return;
      
      detailsImageIndex.value++; // ← ADICIONE ESTA LINHA
      if (detailsImageIndex.value >= images.length) {
        detailsImageIndex.value = 0;
      }
      selectedImage.value = images[detailsImageIndex.value].url;
    };

    // Atalhos de teclado
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isImageZoomApplied.value) return;
      
      if (e.key === 'Escape') {
        closeZoom();
      }
      if (e.key === 'ArrowLeft') {
        previousZoomImage();
      }
      if (e.key === 'ArrowRight') {
        nextZoomImage();
      }
    };

    const userMenuRef = ref<HTMLElement | null>(null); 

    function handleClickOutsideUserMenu(event: MouseEvent) {
      const target = event.target as Node;
      
      if (userMenuRef.value && !userMenuRef.value.contains(target)) {
        menuOpen.value = false;
      }
    }

    const isSidebarOpen = ref(false);
    
    onMounted(async () => {
      try {
        isLoading.value = true; // ← Ativa o loading no início
        
        products.value = await productsWithParams({page: page.value, limit: limit.value});
        acionamentos.value = await fetchAcionamentos();
        buchas.value = await fetchBuchas();
        bases.value = await fetchBases();
        search.value = "";

      checkUserGroup();

      const response = getClaims()
      if (response?.email) {
        getEmail.value = response.email
      }
      
      document.addEventListener('keydown', handleKeydown); // ← ADICIONE
      document.addEventListener("click", handleClickOutsideUserMenu);

      
      // Carrega URLs das imagens
      for (const product of produtosCompletos.value) {
        if (product.images?.[0]?.storage_key) {
          const url = await getImageUrl(product.images[0].storage_key);
          imageUrls.value[product.images[0].storage_key] = url;
        }
      }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Erro no carregamento inicial:', error);
      } finally {
        isLoading.value = false; // ← Garante que sempre desativa o loading
      }
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener("click", handleClickOutsideUserMenu);
      document.body.style.overflow = '';
    });

    const selectDetailImage = (url: string) => {
      console.log('🖼️ Selecionando imagem:', url);
      selectedImage.value = url;
      console.log('✅ selectedImage atualizado:', selectedImage.value);
       detailsImageIndex.value = detailsImages.value.findIndex(img => img.url === imageUrl);
    };

    const previousMainImage = () => {
      console.log('previousMainImage chamado');
      console.log('detailsImages.value.length:', detailsImages.value.length);
      console.log('detailsImageIndex.value antes:', detailsImageIndex.value);
      
      if (detailsImages.value.length > 1) {
        detailsImageIndex.value--;
        if (detailsImageIndex.value < 0) {
          detailsImageIndex.value = detailsImages.value.length - 1;
        }
        console.log('detailsImageIndex.value depois:', detailsImageIndex.value);
        console.log('Nova URL:', detailsImages.value[detailsImageIndex.value].url);
        selectedImage.value = detailsImages.value[detailsImageIndex.value].url;
      }
    };

    const nextMainImage = () => {
      console.log('nextMainImage chamado');
      console.log('detailsImages.value.length:', detailsImages.value.length);
      console.log('detailsImageIndex.value antes:', detailsImageIndex.value);
      
      if (detailsImages.value.length > 1) {
        detailsImageIndex.value++;
        if (detailsImageIndex.value >= detailsImages.value.length) {
          detailsImageIndex.value = 0;
        }
        console.log('detailsImageIndex.value depois:', detailsImageIndex.value);
        console.log('Nova URL:', detailsImages.value[detailsImageIndex.value].url);
        selectedImage.value = detailsImages.value[detailsImageIndex.value].url;
      }
    };

    const currentImageNumber = computed(() => {
      console.log('detailsImageIndex.value:', detailsImageIndex.value);
       return detailsImageIndex.value + 1;
    });

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value;
    };

    return {
      isSidebarOpen,
      userMenuRef,
      clearAllFilters,
      checkUserGroup,
      currentImageNumber,
      previousMainImage,
      nextMainImage,
      selectDetailImage,
      isImageZoomApplied,
      detailsImages,
      detailsImageIndex,
      applySelectedImageZoom,
      closeZoom,
      previousZoomImage,
      nextZoomImage,
      handleKeydown,
      currentImageIndex,
      nextImage,
      previousImage,
      goToImage,
      isLoadingFilters,
      hasAnyFilter,
      isAcionamentoFilterWithValue,
      isBaseFilterWithValue,
      isBuchaFilterWithValue,
      isLoadingDetails,
      fetchedProduct,
      filteredAcionamentos,
      filteredBases,
      filteredBuchas,
      selectedImage,
      images,
      products,
      total,
      page,
      limit,
      search,
      isLoading,
      filterBucha,
      filterAcionamento,
      filterBase,
      buchas,
      acionamentos,
      bases,
      isProductDetailsOpen,
      showUserManagment,
      selectedProduct,
      getEmail,
      menuOpen,

      // actions
      clearFilters,
      paginateAhead,
      paginateReturn,
      logout,
      productsWithParams,
      onSearch,
      filterWithParamsHandler,
      showProductDetails,
      redirectToUserManagment,
      toggleMenu
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
        class="fixed inset-0 flex flex-col items-center justify-center bg-emerald-900 text-white z-70"
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


            <a href="https://wa.me/555433592200?text=Olá!%20Vim%20do%20catálogo%20e%20queria%20saber%20mais%20informações!" target="_blank">

              <button
              v-if="!showUserManagment"
                class="text-white font-semibold flex flex-col-2 gap-3 bg-emerald-800 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer hover:bg-emerald-700"
              >
                <svg class="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" fill-rule="evenodd" d="M12 4a8 8 0 0 0-6.895 12.06l.569.718-.697 2.359 2.32-.648.379.243A8 8 0 1 0 12 4ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-5.016-1.347l-4.948 1.382 1.426-4.829-.006-.007-.033-.055A9.958 9.958 0 0 1 2 12Z" clip-rule="evenodd"/>
                  <path fill="currentColor" d="M16.735 13.492c-.038-.018-1.497-.736-1.756-.83a1.008 1.008 0 0 0-.34-.075c-.196 0-.362.098-.49.291-.146.217-.587.732-.723.886-.018.02-.042.045-.057.045-.013 0-.239-.093-.307-.123-1.564-.68-2.751-2.313-2.914-2.589-.023-.04-.024-.057-.024-.057.005-.021.058-.074.085-.101.08-.079.166-.182.249-.283l.117-.14c.121-.14.175-.25.237-.375l.033-.066a.68.68 0 0 0-.02-.64c-.034-.069-.65-1.555-.715-1.711-.158-.377-.366-.552-.655-.552-.027 0 0 0-.112.005-.137.005-.883.104-1.213.311-.35.22-.94.924-.94 2.16 0 1.112.705 2.162 1.008 2.561l.041.06c1.161 1.695 2.608 2.951 4.074 3.537 1.412.564 2.081.63 2.461.63.16 0 .288-.013.4-.024l.072-.007c.488-.043 1.56-.599 1.804-1.276.192-.534.243-1.117.115-1.329-.088-.144-.239-.216-.43-.308Z"/>
                </svg>
                Entre em contato!
              </button>

            </a>

            <button
              v-if="showUserManagment"
              @click="redirectToUserManagment"
              class="text-white bg-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors hover:cursor-pointer"
            >
              Gerenciar Usuários
            </button>

              <div ref="userMenuRef" class="relative inline-block text-left">
                <!-- Botão principal (inicial + tooltip) -->
                <div class="group relative">
                  <button
                    @click.stop="toggleMenu"
                    class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-white font-semibold cursor-pointer hover:bg-gray-600 transition"
                  >
                    {{ getEmail.charAt(0).toUpperCase() }}
                  </button>

                  <!-- Tooltip com o email -->
                  <div
                    class="absolute left-1/2 transform -translate-x-1/2 -bottom-12 opacity-0 group-hover:opacity-100 pointer-events-none transition bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap"
                  >
                    {{ getEmail }}
                  </div>
                </div>

                <div
                  v-if="menuOpen"
                  class="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-20"
                >
                  <button
                    @click="logout"
                    class="hover:cursor-pointer w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                  >
                    Sair
                  </button>
                </div>
              </div>

          </div>

        </div>

      </header>

    <div class="w-full max-w-screen-2xl mx-auto px-4 mt-10">


      <!-- Container principal: Filtros + Conteúdo -->
      <div class="flex gap-6 relative">
    
    <!-- Botão de toggle para mobile (aparece apenas em telas pequenas) -->
    <button
      @click="isSidebarOpen = !isSidebarOpen"
      class="lg:hidden fixed bottom-6 right-6 z-50 bg-emerald-800 text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
    >
      <svg 
        v-if="!isSidebarOpen"
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke-width="2" 
        stroke="currentColor" 
        class="w-6 h-6"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
      <svg 
        v-else
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke-width="2" 
        stroke="currentColor" 
        class="w-6 h-6"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Overlay escuro (mobile) -->
    <div 
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
    ></div>
    
    <!-- Sidebar de filtros -->
    <aside 
      :class="[
        'w-64 flex-shrink-0 transition-transform duration-300 z-40',
        // Mobile: sidebar deslizante
        'fixed lg:static top-0 left-0 h-full lg:h-auto',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <div class="bg-white/50 dark:bg-gray-400 rounded-lg p-4 space-y-4 lg:sticky lg:top-4 shadow-xl h-full lg:h-auto overflow-y-auto">
        
        <!-- Cabeçalho com botão fechar (mobile) -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-semibold text-black">Filtros</h3>
          <button
            @click="isSidebarOpen = false"
            class="lg:hidden text-gray-600 hover:text-black transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Filtro Bucha -->
        <div>
          <label class="block text-sm font-medium text-black mb-2">Tipo da Bucha</label>
          <div class="relative">
            <select 
              v-model="filterBucha"
              class="w-full h-10 bg-white font-semibold text-black rounded-lg px-3 hover:cursor-pointer hover:bg-gray-300 transition-colors"
            >
              <option disabled value="">Selecione</option>
              <option v-for="bucha in filteredBuchas" :key="bucha.id" :value="bucha.tipobucha">
                {{ bucha.tipobucha }}
              </option>
            </select>

            <button
              v-if="filterBucha"
              @click="filterBucha = ''"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-800 transition-colors hover:cursor-pointer hover:text-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Filtro Acionamento -->
        <div>
          <label class="block text-sm font-medium text-black mb-2">Tipo do Acionamento</label>
          <div class="relative">
            <select 
              v-model="filterAcionamento"
              class="w-full h-10 bg-white font-semibold text-black rounded-lg px-3 hover:cursor-pointer hover:bg-gray-300 transition-colors"
            >
              <option disabled value="">Selecione</option>
              <option v-for="acionamento in filteredAcionamentos" :key="acionamento.id" :value="acionamento.tipoacionamento">
                {{ acionamento.tipoacionamento }}
              </option>
            </select>

            <button
              v-if="filterAcionamento"
              @click="filterAcionamento = ''"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-800 transition-colors hover:cursor-pointer hover:text-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Filtro Base -->
        <div>
          <label class="block text-sm font-medium text-black mb-2">Tipo da Base</label>
          <div class="relative">
            <select 
              v-model="filterBase"
              class="w-full h-10 bg-white font-semibold text-black rounded-lg px-3 hover:cursor-pointer hover:bg-gray-300 transition-colors"
              :class="filterBase ? 'pr-10' : ''"
            >
              <option disabled value="">Selecione</option>
              <option v-for="base in filteredBases" :key="base.id" :value="base.tipobase">
                {{ base.tipobase }}
              </option>
            </select>
            
            <button
              v-if="filterBase"
              @click="filterBase = ''"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-800 transition-colors hover:cursor-pointer hover:text-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
            <svg 
              v-if="!isLoadingFilters"
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 376 384"
            >
              <path fill="currentColor" d="m267 235l106 106l-32 32l-106-106v-17l-6-6q-39 33-90 33q-58 0-98.5-40.5T0 138.5t40.5-98t98-40.5t98 40.5T277 139q0 51-33 90l6 6h17zm-128 0q40 0 68-28t28-68t-28-68t-68-28t-68 28t-28 68t28 68t68 28z"/>
            </svg>
            
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

    <!-- Área principal (direita) -->
    <main class="flex-1 w-full lg:w-auto px-4 lg:px-0">
      
      <!-- Barra superior: Search -->
      <div class="flex items-center mb-6">
        <div class="relative w-full">
          <input
            v-model="search"
            @input="onSearch"
            type="text"
            placeholder="Buscar produto por código..."
            class="p-3 rounded-lg w-full bg-white text-black font-bold"
          />

          <button
            v-if="search"
            @click="search = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 hover:text-black transition-colors hover:cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Grid de produtos -->
      <div id="produtos-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        
        <div v-for="product in products" :key="product.id"
              class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <!-- Foto -->
              <div v-if="product.images && product.images.length > 0" class="relative group">
                  <!-- Imagem atual -->
                  <img 
                    :src="product.images[currentImageIndex[product.id] || 0].url" 
                    :alt="product.images[currentImageIndex[product.id] || 0].file_name"
                    class="w-full h-82 object-vover rounded-t-xl"
                  >
                  
                  <!-- Botões de navegação (aparecem no hover) -->
                  <div v-if="product.images.length > 1" class="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <!-- Botão anterior -->
                    <button
                      @click.stop="previousImage(product.id, product.images.length)"
                      class="hover:cursor-pointer bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all hover:scale-110"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    
                    <!-- Botão próximo -->
                    <button
                      @click.stop="nextImage(product.id, product.images.length)"
                      class="hover:cursor-pointer bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all hover:scale-110"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>

                    <!-- Contador de imagens -->
                    <div v-if="product.images.length > 1" class="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {{ (currentImageIndex[product.id] || 0) + 1 }} / {{ product.images.length }}
                    </div>
                  </div>
                  
                  <!-- Indicadores de imagem (bolinhas) -->
                  <div v-if="product.images.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    <button
                      v-for="(image, index) in product.images"
                      :key="index"
                      @click.stop="goToImage(product.id, index)"
                      class="w-2 h-2 rounded-full transition-all hover:scale-125"
                      :class="(currentImageIndex[product.id] || 0) === index ? 'bg-white w-6' : 'bg-white/50'"
                    ></button>
                  </div>
                </div>

                <div v-else class="w-full h-82 bg-gray-200 rounded-t-xl flex items-center justify-center">
                  <span class="text-gray-500">Sem imagem</span>
                </div>

              <!-- Conteúdo -->
              <div class="p-5 flex flex-col space-y-4">
                <!-- Tipo e nome -->
                <div>
                  <h1 class="font-fira text-zinc-800 text-xl font-semibold">
                    Pé de Apoio {{ product.capacidade_estatica }} Kg Acionamento {{ product.tipoacionamento }}
                  </h1>
                </div>

                <!-- Código -->
                <div>
                  <h1 class="font-fira text-zinc-800 text-sm">Código</h1>
                  <div class="flex items-center justify-between">
                    <h1 class="font-fira text-zinc-700 font-bold text-2xl">{{ product.codigo }}</h1>
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
      <div v-if="!isLoading && products.length === 0" class="text-center py-20">
        <div class="flex flex-col items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-20 h-20 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <div>
            <p class="text-xl font-semibold text-gray-700 mb-2">
              Nenhum produto encontrado
            </p>
            <p class="text-gray-500 px-4">
              {{ search ? `Não encontramos resultados para "${search}"` : 'Tente ajustar os filtros de busca' }}
            </p>
          </div>
          <button
            v-if="search || hasAnyFilter"
            @click="clearAllFilters()"
            class="mt-4 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-600 text-white rounded-lg transition-colors hover:cursor-pointer"
          >
            Limpar {{ search && hasAnyFilter ? 'busca e filtros' : search ? 'busca' : 'filtros' }}
          </button>
        </div>
      </div>
    </main>

  </div>

        <div
        v-if="isProductDetailsOpen && selectedProduct"
        class="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-black/60 z-40"
      >
        <div class="relative bg-gray-300 p-6 rounded-lg shadow-lg w-[95%] max-w-6xl max-h-[95vh] overflow-y-auto">

          <button
            @click="isProductDetailsOpen = false"
            class="absolute top-4 right-4 text-gray-700 p-3 hover:cursor-pointer hover:bg-gray-400 rounded-lg z-10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">

            <!-- Coluna: imagens -->
            <div class="flex flex-col h-[600px] w-full gap-4">
              
              <!-- Imagem principal -->
              <!-- Imagem principal -->
              <div class="flex-1 flex justify-center items-center rounded-lg min-h-[500px] relative group">
                <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  alt="Imagem principal"
                  class="max-h-[500px] max-w-full w-auto h-auto object-contain rounded transition-all duration-300 cursor-zoom-in"
                  @click="applySelectedImageZoom"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                  <div class="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto mb-2 text-gray-400">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <p class="text-lg">Sem imagem</p>
                  </div>
                </div>

                <!-- Setas aparecem por cima da imagem no hover -->
                <button
                  v-if="detailsImages.length > 1 && selectedImage"
                  @click.stop="previousMainImage"
                  class="hover:cursor-pointer absolute left-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <button
                  v-if="detailsImages.length > 1 && selectedImage"
                  @click.stop="nextMainImage"
                  class="hover:cursor-pointer absolute right-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              <!-- Miniaturas -->
              <div class="h-24 flex justify-center items-center">
                <div v-if="detailsImages.length > 0" class="flex gap-2 overflow-x-auto pb-2 max-w-full">
                  <div
                    v-for="(img, index) in detailsImages"
                    :key="img.id || index"
                    class="flex-shrink-0"
                  >
                    <img
                      :src="img.url"
                      :alt="img.file_name"
                      class="h-20 w-20 object-cover rounded cursor-pointer transition-all border-2"
                      :class="selectedImage === img.url ? 'border-emerald-700 ring-4 ring-emerald-500' : 'border-gray-300'"
                      @click="selectDetailImage(img.url)"
                    />
                  </div>
                </div>
                <div v-else class="text-black p-4 rounded">
                  Nenhuma miniatura disponível
                </div>
              </div>
            </div>

            <!-- Coluna: info -->
            <div class="flex flex-col justify-between h-full">
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

                <div class="h-12 justify-end flex">
                  <a  :href="`https://wa.me/555433592200?text=${encodeURIComponent('Olá! Vim do catálogo e quero saber mais sobre o produto ' + fetchedProduct?.codigo)}`" target="_blank">
                    <button 
                      class="py-3 px-4 bg-emerald-800 text-white rounded-lg hover:bg-emerald-600 transition-colors hover:cursor-pointer flex items-center justify-center gap-2 font-fira text-lg font-semibold" 
                    >
                      <svg class="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" fill-rule="evenodd" d="M12 4a8 8 0 0 0-6.895 12.06l.569.718-.697 2.359 2.32-.648.379.243A8 8 0 1 0 12 4ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-5.016-1.347l-4.948 1.382 1.426-4.829-.006-.007-.033-.055A9.958 9.958 0 0 1 2 12Z" clip-rule="evenodd"/>
                        <path fill="currentColor" d="M16.735 13.492c-.038-.018-1.497-.736-1.756-.83a1.008 1.008 0 0 0-.34-.075c-.196 0-.362.098-.49.291-.146.217-.587.732-.723.886-.018.02-.042.045-.057.045-.013 0-.239-.093-.307-.123-1.564-.68-2.751-2.313-2.914-2.589-.023-.04-.024-.057-.024-.057.005-.021.058-.074.085-.101.08-.079.166-.182.249-.283l.117-.14c.121-.14.175-.25.237-.375l.033-.066a.68.68 0 0 0-.02-.64c-.034-.069-.65-1.555-.715-1.711-.158-.377-.366-.552-.655-.552-.027 0 0 0-.112.005-.137.005-.883.104-1.213.311-.35.22-.94.924-.94 2.16 0 1.112.705 2.162 1.008 2.561l.041.06c1.161 1.695 2.608 2.951 4.074 3.537 1.412.564 2.081.63 2.461.63.16 0 .288-.013.4-.024l.072-.007c.488-.043 1.56-.599 1.804-1.276.192-.534.243-1.117.115-1.329-.088-.144-.239-.216-.43-.308Z"/>
                      </svg>

                      <span>Contatar equipe comercial</span>
                    </button>
                  </a>
                </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Zoom (mantenha como está) -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="isImageZoomApplied"
            class="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <div class="relative w-full h-full flex items-center justify-center">
              <button @click="closeZoom" class="hover:cursor-pointer absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <img :src="selectedImage" class="max-w-full max-h-full object-contain" @click.stop />

              <button v-if="detailsImages.length > 1" @click.stop="previousZoomImage" class="hover:cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button v-if="detailsImages.length > 1" @click.stop="nextZoomImage" class="hover:cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <div v-if="detailsImages.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
                {{ currentImageNumber }} / {{ detailsImages.length }}
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

        <!-- Repita o card ou use v-for -->

        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 justify-between flex flex-cols-2 mt-10">
            <div class="flex items-center">
              <p class="text-md text-white">
                Mostrando <span class="font-semibold">{{ products.length }}</span> Produto(s)
              </p>
              <!-- Aqui você pode adicionar paginação depois -->
            </div>

            <div class="flex flex-cols-2">

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
                  <p class="">Página {{ page }}</p>
                  <button 
                    class="btnPagination bg-emerald-800"
                    @click="paginateAhead"
                  >
                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          </div>
        
      </div>

      <footer class="bg-white dark:bg-emerald-950 text-black dark:text-white w-full mt-10">
        <div class="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center space-y-6">
          <!-- Logo -->
          <img src="../../../../imgstorage/logo/logorobusteccinza.png" alt="Logo" class="h-16">

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