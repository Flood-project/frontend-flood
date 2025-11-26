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
import { getImageUrl } from "../../repository/object_store";


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

    newProduct.value = { id: 0,codigo: "", description: "", capacidade_estatica: 0, capacidade_trabalho: 0, reducao: "", altura_bucha: 0, curso: 0, id_bucha: 0, id_acionamento: 0, id_base: 0, ativo: true};

    newBucha.value = { id: 0, tipobucha: ""};

    newBase.value = { id: 0, tipobase: ""};

    newAcionamento.value = { id: 0, tipoacionamento: ""};

    const selectedFiles = ref<{[key: number]: File}>({});
    const selectedFileNames = ref<{[key: number]: string}>({});

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
      
      // ADICIONE ISTO: Atualiza também o editingProduct
      if (editingProduct.value) {
        editingProduct.value.id_acionamento = a.id;
        editingProduct.value.tipoacionamento = a.tipoacionamento;
      }
      
      acionamentoSearchTerm.value = a.tipoacionamento;
      showAcionamentosDropdown.value = false;
    };

    const selectBucha = (a: { id: number; tipobucha: string }) => {
      selectedBucha.value = a;
      
      if (newProduct.value) {
        newProduct.value.id_bucha = a.id;
      }
      
      // ADICIONE ISTO
      if (editingProduct.value) {
        editingProduct.value.id_bucha = a.id;
        editingProduct.value.tipobucha = a.tipobucha;
      }
      
      buchaSearchTerm.value = a.tipobucha;
      showBuchasDropdown.value = false;
    };

    const selectBase = (a: { id: number; tipobase: string }) => {
      selectedBase.value = a;
      
      if (newProduct.value) {
        newProduct.value.id_base = a.id;
      }
      
      // ADICIONE ISTO
      if (editingProduct.value) {
        editingProduct.value.id_base = a.id;
        editingProduct.value.tipobase = a.tipobase;
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

    const isAlertDeleteProductModalOpen = ref(false)

    const productToDelete = ref<Product | null>(null);

    function openAlertDeleteProductModal (p: Product) {
      console.log('🗑️ Abrindo modal de exclusão para:', p);
      productToDelete.value = p; // ← Guarda o produto
      isAlertDeleteProductModalOpen.value = true;
    }

    const closeDeleteModal = () => {
      isAlertDeleteProductModalOpen.value = false;
      productToDelete.value = null;
    };

    const confirmDelete = async () => {
      if (!productToDelete.value) {
        console.error('❌ Nenhum produto selecionado para exclusão');
        return;
      }

      console.log('🗑️ Excluindo produto:', productToDelete.value.id);

      try {
        await deleteProductById(productToDelete.value.id);
        
        // Remove da lista local
        products.value = products.value.filter((p) => p.id !== productToDelete.value!.id);
        
        console.log('✅ Produto excluído com sucesso');
        
        // Fecha o modal
        closeDeleteModal();
        
        alert('Produto excluído com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    };

    // Inativa o produto (abre modal de edição)
    const inactivateProduct = () => {
      if (!productToDelete.value) {
        console.error('❌ Nenhum produto selecionado');
        return;
      }

      console.log('⚙️ Abrindo modal de edição para inativar:', productToDelete.value);

      // Fecha o modal de exclusão
      isAlertDeleteProductModalOpen.value = false;

      // Abre o modal de edição
      openEditModal(productToDelete.value);

      // Limpa a referência
      productToDelete.value = null;
    };

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
      isAdicionarOpen.value = false;
      action();
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

    const redirectToAcionamentos = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/acionamentos'})
        } else {
          router.push({path: '/'})
        }

    };

    const redirectToBuchas = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/buchas'})
        } else {
          router.push({path: '/'})
        }

    };

    const redirectToBases = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/bases'})
        } else {
          router.push({path: '/'})
        }

    };

      const addOptions = ref([
      { label: "Buchas", action: redirectToBuchas },
      { label: "Acionamentos", action: redirectToAcionamentos },
      { label: "Bases", action: redirectToBases },
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
      newProduct.value = { id: 0,codigo: "", description: "", capacidade_estatica: 0, capacidade_trabalho: 0, reducao: "", altura_bucha: 0, curso: 0, id_bucha: 0, id_acionamento: 0, id_base: 0, ativo: true};
      isAddModalOpen.value = true
    }

    const selectedImage = ref<string>('');
    const selectedProduct = ref<Product | null>(null);    

    const isLoadingDetails = ref(false);

    const imageUrls = ref<Record<string, string>>({});

    const showProductDetails = async (p: Product) => {
        console.log('🔵 showProductDetails - produto:', p);
        console.log('🔵 Imagens do produto p:', p.images);

        selectedProduct.value = p;

        // Define a primeira imagem como selecionada
        if (p.images && p.images.length > 0) {
          selectedImage.value = p.images[0]?.url || '';
          console.log('✅ selectedImage inicial definido:', selectedImage.value);
        } else {
          selectedImage.value = '';
          console.log('⚠️ Produto sem imagens');
        }
        
        try {
          isLoadingDetails.value = true;

          const response = await fetchById(p.id);
          console.log('📦 Response do fetchById:', response);

          fetchedProduct.value = {
            ...response,
            tipoacionamento: acionamentoMap.value[response.id_acionamento] || "Desconhecido",
            tipobucha: buchaMap.value[response.id_bucha] || "Desconhecido",
            tipobase: baseMap.value[response.id_base] || "Desconhecido",
          };

          console.log('📦 fetchedProduct.value:', fetchedProduct.value);

          // AS IMAGENS JÁ VÊM COM URL! Não precisa processar nada
          console.log('✅ Imagens já têm URL:', fetchedProduct.value.images);

          await new Promise(resolve => setTimeout(resolve, 200));

          // Atualiza selectedProduct e selectedImage
          selectedProduct.value = fetchedProduct.value;
          
          if (fetchedProduct.value.images && fetchedProduct.value.images.length > 0) {
            selectedImage.value = fetchedProduct.value.images[0].url;
            console.log('🎯 selectedImage atualizado para:', selectedImage.value);
          }

          console.log('🏁 selectedProduct final:', selectedProduct.value);
          console.log('🏁 selectedImage final:', selectedImage.value);

          isProductDetailsOpen.value = true;

        } catch (error) {
          console.error('❌ Erro ao carregar detalhes:', error);
          alert('Erro ao carregar os detalhes do produto. Tente novamente.');
        } finally {
          isLoadingDetails.value = false;
        }
      };

    // Salvar edição
    const editProduct = async () => {
      if (!editingProduct.value) return;

      try {
        console.log('📝 Iniciando edição do produto...');
        console.log('📝 Dados do produto:', editingProduct.value);

        // IMPORTANTE: Enviar os IDs, não as strings!
        const productData: Product = {
          id: editingProduct.value.id,
          codigo: editingProduct.value.codigo,
          capacidade_estatica: editingProduct.value.capacidade_estatica,
          capacidade_trabalho: editingProduct.value.capacidade_trabalho,
          curso: editingProduct.value.curso,
          altura_bucha: editingProduct.value.altura_bucha,
          reducao: editingProduct.value.reducao,
          description: editingProduct.value.description,
          ativo: editingProduct.value.ativo,
          id_acionamento: editingProduct.value.id_acionamento, // ← IDs, não strings!
          id_bucha: editingProduct.value.id_bucha,
          id_base: editingProduct.value.id_base,
        };

        console.log('📝 Payload que será enviado:', JSON.stringify(productData, null, 2));

        // 1. Atualiza o produto
        let updated = await updateProduct(editingProduct.value.id, productData);
        
        console.log('✅ Produto atualizado!');

        // 2. Faz upload das imagens (se houver)
        if (Object.keys(selectedFiles.value).length > 0) {
          console.log('📤 Iniciando upload de imagens...');
          await uploadAllFiles(editingProduct.value.id);
          console.log('✅ Upload de imagens concluído!');
        } else {
          console.log('📁 Nenhuma imagem para upload');
        }

        // 3. Recarrega a lista
        await productsWithParams({ page: page.value, limit: limit.value });
        isEditModalOpen.value = false;
        
        alert('Produto editado com sucesso!');

      } catch (error: any) {
        console.error('❌ Erro completo:', error);
        console.error('❌ Response data:', error.response?.data);
        console.error('❌ Response status:', error.response?.status);
        alert(`Erro ao editar produto: ${error.response?.data || error.message}`);
      }
    };

    const addProduct = async (newProduct: Product) => {
      console.log(acionamentos.value);
      console.log(newProduct, "antes de chamar create product");
      
      if (newProduct) {
        try {
          // 1. Cria o produto
          const createdProduct = await createProduct(newProduct);
          console.log('✅ Produto criado:', createdProduct);
          
          // 2. Faz upload das imagens (se houver)
          if (Object.keys(selectedFiles.value).length > 0) {
            console.log('📤 Iniciando upload de imagens...');
            await uploadAllFiles(createdProduct.id);
            console.log('✅ Upload de imagens concluído!');
          } else {
            console.log('📁 Nenhuma imagem para upload');
          }
            
          // 3. Recarrega a lista
          await productsWithParams({ page: page.value, limit: limit.value });
          isAddModalOpen.value = false;
          
          alert('Produto criado com sucesso!');
          
        } catch (error: any) {
          console.error("❌ Erro ao criar produto:", error);
          alert(`Erro ao criar produto: ${error.response?.data || error.message}`);
        }
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

    const handleFileInput = (event: Event, inputId?: number) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      console.log(file, inputId)
      
      if (!file || !inputId) {
        console.log('❌ Nenhum arquivo selecionado');
        return;
      }
      
      // Armazena o arquivo e o nome para exibição
      selectedFiles.value[inputId] = file;
      selectedFileNames.value[inputId] = file.name;
      
      console.log('📁 Arquivo selecionado:', file.name);
    };

    const uploadAllFiles = async (productId: number) => {
      const filesToUpload = Object.values(selectedFiles.value);
      
      if (filesToUpload.length === 0) {
        console.log('📁 Nenhum arquivo para upload');
        return;
      }
      
      console.log(`📤 Fazendo upload de ${filesToUpload.length} arquivo(s)...`);
      
      try {
        for (const file of filesToUpload) {
          await createFile(file, productId);
          console.log('✅ Upload concluído:', file.name);
        }
        
        // Limpa os arquivos selecionados
        selectedFiles.value = {};
        selectedFileNames.value = {};
        
        // Recarrega a lista
        await productsWithParams({ page: page.value, limit: limit.value });
        
        console.log('✅ Todos os uploads concluídos!');
        
      } catch (error: any) {
        console.error('❌ Erro no upload:', error);
        throw error; // Propaga o erro para ser tratado no editProduct
      }
    };

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
      console.log('🔍 detailsImages sendo chamado');
      console.log('🔍 selectedProduct.value:', selectedProduct.value);
      console.log('🔍 selectedProduct.value?.images:', selectedProduct.value?.images);
      
      if (!selectedProduct.value?.images) {
        console.log('⚠️ selectedProduct sem imagens');
        return [];
      }
      
      const imgs = selectedProduct.value.images;
      console.log('✅ detailsImages retornando:', imgs);
      console.log('✅ Primeira imagem detalhada:', imgs[0]);
      
      return imgs;
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
    

    onMounted(async () => {
      products.value = await productsWithParams({page: page.value, limit: limit.value});
      acionamentos.value = await fetchAcionamentos();
      buchas.value = await fetchBuchas();
      bases.value = await fetchBases();
      search.value = "";
      
      // Event listeners
      document.addEventListener("click", handleClickOutside);
      document.addEventListener('keydown', handleKeydown); // ← ADICIONE
      
      // Carrega URLs das imagens
      for (const product of produtosCompletos.value) {
        if (product.images?.[0]?.storage_key) {
          const url = await getImageUrl(product.images[0].storage_key);
          imageUrls.value[product.images[0].storage_key] = url;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      isLoading.value = false;
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClickOutside);
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

    return {
      selectedFiles,
      selectedFileNames, // ← Use este no template ao invés de selectedFiles
      uploadAllFiles,
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
      redirectToBuchas,
      redirectToBases,
      redirectToAcionamentos,
      isAlertDeleteProductModalOpen,
      productToDelete,
      openAlertDeleteProductModal,
      closeDeleteModal,
      confirmDelete,
      inactivateProduct,
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
      imageUrls
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

            <button
              @click="redirectToLogs"
              class="text-black hover:bg-orange-500 font-semibold flex flex-col-2 gap-3 bg-gray-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ring-2 ring-orange-700"
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


                Cadastros
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
                  
                  <!-- Contador de imagens -->
                  <div v-if="product.images.length > 1" class="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {{ (currentImageIndex[product.id] || 0) + 1 }} / {{ product.images.length }}
                  </div>
                </div>
                
                <div v-else class="w-full h-82 bg-gray-200 rounded-t-xl flex items-center justify-center">
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
                          class="p-1.5 bg-red-700 text-white rounded-sm hover:bg-red-600 transition-colors hover:cursor-pointer"
                          @click="openAlertDeleteProductModal(product)"
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
    

        <div
          v-if="isAlertDeleteProductModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
        >
          <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            
            <!-- Header do Modal -->
            <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-3xl font-bold text-black">Tem certeza que você deseja excluir o produto?</h3>
                  <!-- Mostra qual produto será excluído -->
                  <p v-if="productToDelete" class="text-md text-gray-600 mt-2">
                    Código: <span class="font-semibold">{{ productToDelete.codigo }}</span>
                  </p>
                </div>
                <button
                  @click="closeDeleteModal"
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
              <div class="space-y-5">
                <h1 class="text-black">Se você prosseguir, o registro do produto será <span class="text-italic text-red-600 underline">apagado</span> <span class="text-italic text-red-600 underline">permanentemente</span>.</h1>

                <h1 class="text-black">Se você quer ainda manter o registro, você pode apenas <span class="text-black font-bold">desativar</span> o produto</h1>
              </div>
            </div>

            <!-- Footer com botões -->
            <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
              <div class="flex gap-3">
                <button
                  @click="confirmDelete"
                  class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-red-700 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Excluir mesmo assim
                </button>
                <button
                  @click="inactivateProduct"
                  class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Inativar
                </button>
              </div>
            </div>

          </div>
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
                  
                  <div class="grid grid-cols-3 gap-4">
                     <div>
                        <input 
                          type="file" 
                          id="file-input-1"
                          class="hidden"
                          @change="(event) => handleFileInput(event, 1)"
                          accept="image/*"
                          multiple
                        />
                        <label 
                          for="file-input-1"
                          class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all flex items-center justify-center text-sm"
                        >
                          <span v-if="!selectedFileNames[1]">Escolher arquivo</span>
                          <span v-else class="truncate">{{ selectedFileNames[1] }}</span>
                        </label>
                      </div>

                      <!-- Input 2 -->
                      <div>
                        <input 
                          type="file" 
                          id="file-input-2"
                          class="hidden"
                          @change="(event) => handleFileInput(event, 2)"
                          accept="image/*"
                          multiple
                        />
                        <label 
                          for="file-input-2"
                          class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all flex items-center justify-center text-sm"
                        >
                          <span v-if="!selectedFileNames[2]">Escolher arquivos</span>
                          <span v-else class="truncate">{{ selectedFileNames[2] }}</span>
                        </label>
                      </div>

                      <!-- Input 3 -->
                      <div>
                        <input 
                          type="file" 
                          id="file-input-3"
                          class="hidden"
                          @change="(event) => handleFileInput(event, 3)"
                          accept="image/*"
                          multiple
                        />
                        <label 
                          for="file-input-3"
                          class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all flex items-center justify-center text-sm"
                        >
                          <span v-if="!selectedFileNames[3]">Escolher arquivos</span>
                          <span v-else class="truncate">{{ selectedFileNames[3] }}</span>
                        </label>
                      </div>
                  </div>
                </div>

                <div class="flex flex-col justify-between">
                  <div class="flex justify-end">
                    <div class="p-2">
                      <label class="block text-sm font-medium text-black mb-2 text-right">Situação</label>
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-black">
                          {{ editingProduct?.ativo ? 'Ativo' : 'Inativo' }}
                        </span>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            :checked="editingProduct?.ativo"
                            @change="editingProduct.ativo = $event.target.checked"
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
                  
                  <div class="grid grid-cols-3 gap-4">
                    <input 
                      type="file" 
                      id="file-input-1"
                      class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all"
                      @change="(event) => handleFileInput(event, 1)"
                      accept="image/*"
                      multiple
                    />

                    <input 
                      type="file" 
                      id="file-input-2"
                      class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all"
                      @change="(event) => handleFileInput(event, 2)"
                      accept="image/*"
                      multiple
                    />

                    <input 
                      type="file" 
                      id="file-input-3"
                      class="w-full px-4 py-3 bg-white border border-black rounded-xl text-black cursor-pointer hover:bg-gray-300 transition-all"
                      @change="(event) => handleFileInput(event, 3)"
                      accept="image/*"
                      multiple
                    />
                  </div>
                </div>

                <div class="flex flex-col justify-between">
                  <div class="flex justify-end">
                    <div class="p-2">
                      <label class="block text-sm font-medium text-black mb-2 text-right">Situação</label>
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-black">
                          {{ newProduct?.ativo ? 'Ativo' : 'Inativo' }}
                        </span>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            :checked="newProduct?.ativo"
                            @change="newProduct.ativo = $event.target.checked"
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
              class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
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
              class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
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
              class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
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