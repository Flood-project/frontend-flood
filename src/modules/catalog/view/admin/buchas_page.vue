<script lang="ts">
import { defineComponent, ref, onMounted, computed, onUnmounted, watch } from "vue";
import type { Product, DetailedProduct } from "../../domain/product"; 
import type { Bucha } from "../../domain/bucha"; 
import { useRouter } from "vue-router";
import { fetchBuchas, fetchBuchaById, createBucha, deleteBuchaById, updateBucha } from "../../repository/bucha_repository"
import type { ProductWithComponents } from "../../domain/productWithComponents";
import { removeAccessTokens } from "../../../../services/token";
import { router } from "../../../../router";
import { getClaims } from "../../../../services/jwt_decoder";
import { createFile } from "../../../object_store/repository/object_store_repository";


export default defineComponent({
  setup() {

    const buchas = ref<{ id: number; tipobucha: string }[]>([]);

    const loading = ref(false);
    const search = ref("");
    const page = ref(1);
    const limit = ref(10);
    const total = ref(0)
    let timeout: number | undefined

    const isLoading = ref(true);

    const newBucha = ref<Bucha | null>(null);

    newBucha.value = { id: 0, tipobucha: ""};

    const errorMessageBucha = ref('');

    const editingbucha = ref<Bucha | null>(null);

    const isEditBuchaModalOpen = ref (false);
    
    const isAddBuchaModalOpen = ref (false);

    const toast = ref({
      show: false,
      message: '',
      type: 'success' // 'success', 'error', 'warning', 'info'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      toast.value = {
        show: true,
        message,
        type
      };

      // Auto-hide após 3 segundos
      setTimeout(() => {
        toast.value.show = false;
      }, 3000);
    };

    const redirectToAcionamentos = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/acionamentos'})
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

    const redirectToHomePage = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/catalog'})
        } else {
          router.push({path: '/'})
        }

    };

    const redirectToLogs = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/logs'})
        } else {
          router.push({path: '/'})
        }

    };

     const isAdicionarOpen = ref(false);

    const menuRef = ref<HTMLElement | null>(null);

    function handleClickOutside(event: MouseEvent) {

      const target = event.target as Node;
  
      console.log('=== CLICK OUTSIDE DISPARADO ===');
      console.log('menuRef.value:', menuRef.value);
      console.log('isAdicionarOpen antes:', isAdicionarOpen.value);
      console.log('contains:', menuRef.value?.contains(target));
      
      if (menuRef.value && !menuRef.value.contains(target)) {
        console.log('FECHANDO MENU!');
        isAdicionarOpen.value = false;
      }
    }

    const addOptions = ref([
      { label: "Acionamentos", action: redirectToAcionamentos },
      { label: "Bases", action: redirectToBases },
    ]);

    function toggleAddMenu() {
      isAdicionarOpen.value = !isAdicionarOpen.value;
    }

    function selectAddOption(action: Function) {
      isAdicionarOpen.value = false;
      action();
    }
    
    function openAddBuchaModal() {

      newBucha.value = { id: 0, tipobucha: ""};

      isAddBuchaModalOpen.value = true;
    }

    const addBucha = async (newBucha: Bucha) => {

     if (newBucha) {
        try {
          errorMessageBucha.value = '';

          isAddBuchaModalOpen.value = true;
          
          if (!newBucha.tipobucha || newBucha.tipobucha.trim() === '') {
            errorMessageBucha.value = 'O tipo do Bucha é obrigatório.';
            return;
          }

          await createBucha(newBucha);

          buchas.value = await fetchBuchas()

          isAddBuchaModalOpen.value = false;

          showToast('Bucha criada com sucesso!', 'success');

        } catch (error: any) {
          showToast('Erro ao criar bucha. Tente novamente!', 'error');
        }
      }
    };

    const buchaId = ref(0)
    function openEditBuchaModal(bucha: Bucha) {
        console.log('✏️ Abrindo modal de edição para:', bucha);
        
        // Copia os dados do Bucha para editingBucha
        editingbucha.value = { ...bucha };
        
        buchaId.value = bucha.id;
        isEditBuchaModalOpen.value = true;
        }

    const editBucha = async (editingbucha: Bucha) => {
      
        errorMessageBucha.value = '';
      
        console.log(editingbucha);

      if (!editingbucha.tipobucha || editingbucha.tipobucha.trim() === '') {
        errorMessageBucha.value = 'O tipo da Bucha é obrigatório.';
        return;
      }

      if (editingbucha) {

        try {

          isEditBuchaModalOpen.value = false 

        

          const updated = await updateBucha(editingbucha.id, editingbucha);
          // atualiza na lista

          const index = buchas.value.findIndex(a => a.id === editingbucha.id);
          if (index !== -1) {
            buchas.value[index] = updated;
          }

          showToast('Bucha atualizada com sucesso!', 'success');

        } catch (error: any) {
          showToast('Erro ao atualizar bucha. Tente novamente', 'error');
        }
      }
    };

    const isAlertDeleteBuchaModalOpen = ref(false)

    const buchaToDelete = ref<Bucha | null>(null);

    function openAlertDeleteBuchaModal (a: Bucha) {
      console.log('🗑️ Abrindo modal de exclusão para:', a);
      buchaToDelete.value = a; // ← Guarda o produto
      isAlertDeleteBuchaModalOpen.value = true;
    }

    const closeDeleteModal = () => {
      isAlertDeleteBuchaModalOpen.value = false;
      buchaToDelete.value = null;
    };

    const confirmDelete = async () => {
      if (!buchaToDelete.value) {
        console.error('❌ Nenhum Bucha selecionado para exclusão');
        return;
      }

      console.log('🗑️ Excluindo produto:', buchaToDelete.value.id);

      try {

        await deleteBuchaById(buchaToDelete.value.id);
        
        // Remove da lista local
        buchas.value = buchas.value.filter((p) => p.id !== buchaToDelete.value!.id);
        
        console.log('✅ Bucha excluído com sucesso');
        
        // Fecha o modal
        closeDeleteModal();
        
        showToast('Bucha excluída com sucesso!', 'success');
        
      } catch (error) {
        console.error('❌ Erro ao excluir Bucha:', error);
        showToast('Erro ao excluir bucha. Tente novamente.', 'error');
      }
    };
     
    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }

    onMounted(async () => {
      buchas.value = await fetchBuchas()
      document.addEventListener("click", handleClickOutside);
      await new Promise(resolve => setTimeout(resolve, 1000))
      isLoading.value = false
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      logout,
      buchas,
      isLoading,
      editingbucha,
      newBucha,
      openAddBuchaModal,
      addBucha,
      openEditBuchaModal,
      errorMessageBucha,
      isEditBuchaModalOpen,
      editBucha,
      openAlertDeleteBuchaModal,
      isAlertDeleteBuchaModalOpen,
      buchaToDelete,
      closeDeleteModal,
      confirmDelete,
      isAddBuchaModalOpen,
      addOptions,
      handleClickOutside,
      toggleAddMenu,
      isAdicionarOpen,
      menuRef,
      selectAddOption,
      redirectToHomePage,
      redirectToLogs,
      toast,
      showToast
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
          <button @click="redirectToHomePage" class="flex items-center justify-start hover:cursor-pointer">
            
              <img 
                src="../../../../../imgstorage/logo/robustec.jpg" 
                alt="Logo" 
                class="h-28 object-contain mx-auto"
              >
            
          </button>

          <!-- Título central -->
          <h2 class="text-3xl font-bold text-neutral-950 text-center flex-1">
            Lista de Buchas
          </h2>

          <!-- Ações à direita -->
          <div class="flex justify-end items-center gap-6">

            <button
              @click="redirectToHomePage"
              class="text-white font-semibold flex flex-col-2 gap-3 bg-emerald-800 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer hover:bg-emerald-700"
            >
              Página Inicial
            </button>


            <button
              @click="redirectToLogs"
              class="text-black hover:ring-orange-500 hover:ring-3 font-semibold flex flex-col-2 gap-3 bg-gray-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ring-2 ring-orange-700"
            >
              Auditoria
            </button>

            <div ref="menuRef" class="relative inline-block text-left">
              <button
                @click.stop="toggleAddMenu"
                class="text-black font-semibold flex flex-col-2 gap-3 bg-gray-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ring-2 ring-emerald-700 hover:ring-emerald-800 hover:ring-3"
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

        <div class="rounded-2xl overflow-hidden">
  
        <!-- Repita o card ou use v-for -->

        <div class="bg-neutral-400/50 px-6 py-5 border-b border-gray-200 dark:border-gray-600">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              <!-- Search -->
              <div class="w-full sm:w-auto flex-1 max-w-md">
                <div class="flex items-center gap-3">
                    <svg class="w-7 h-7 text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M7.58209 8.96025 9.8136 11.1917l-1.61782 1.6178c-1.08305-.1811-2.23623.1454-3.07364.9828-1.1208 1.1208-1.32697 2.8069-.62368 4.1363.14842.2806.42122.474.73509.5213.06726.0101.1347.0133.20136.0098-.00351.0666-.00036.1341.00977.2013.04724.3139.24069.5867.52125.7351 1.32944.7033 3.01552.4971 4.13627-.6237.8375-.8374 1.1639-1.9906.9829-3.0736l4.8107-4.8108c1.0831.1811 2.2363-.1454 3.0737-.9828 1.1208-1.1208 1.3269-2.80688.6237-4.13632-.1485-.28056-.4213-.474-.7351-.52125-.0673-.01012-.1347-.01327-.2014-.00977.0035-.06666.0004-.13409-.0098-.20136-.0472-.31386-.2406-.58666-.5212-.73508-1.3294-.70329-3.0155-.49713-4.1363.62367-.8374.83741-1.1639 1.9906-.9828 3.07365l-1.7788 1.77875-2.23152-2.23148-1.41419 1.41424Zm1.31056-3.1394c-.04235-.32684-.24303-.61183-.53647-.76186l-1.98183-1.0133c-.38619-.19746-.85564-.12345-1.16234.18326l-.86321.8632c-.3067.3067-.38072.77616-.18326 1.16235l1.0133 1.98182c.15004.29345.43503.49412.76187.53647l1.1127.14418c.3076.03985.61628-.06528.8356-.28461l.86321-.8632c.21932-.21932.32446-.52801.2846-.83561l-.14417-1.1127ZM19.4448 16.4052l-3.1186-3.1187c-.7811-.781-2.0474-.781-2.8285 0l-.1719.172c-.7811.781-.7811 2.0474 0 2.8284l3.1186 3.1187c.7811.781 2.0474.781 2.8285 0l.1719-.172c.7811-.781.7811-2.0474 0-2.8284Z"/>
                    </svg>

                    <h1 class="text-black text-3xl">Buchas</h1>
                </div>
            </div>

              <!-- Botão Novo Usuário -->
              <button
                @click="openAddBuchaModal()"
                class="w-full hover:cursor-pointer sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nova Bucha
              </button>
            </div>
          </div>

          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead class="bg-neutral-400/50">
              <tr>
                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-black dark:text-black uppercase tracking-wider">
                  Tipo da Bucha
                </th>
                <th scope="col" class="px-6 py-4 text-center text-xs font-bold text-black dark:text-black uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody class="bg-neutral-200 dark:bg-neutral-300 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="bucha in buchas"
                :key="bucha.id"
                class="hover:bg-gray-50 dark:hover:bg-neutral-400 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-neutral-400 dark:bg-black-900/30 rounded-full flex items-center justify-center">
                      <span class="text-black dark:text-black font-semibold text-sm">
                        {{ bucha.tipobucha.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div class="ml-4">
                      <div class="text-md font-medium text-black">
                        {{ bucha.tipobucha }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditBuchaModal(bucha)"
                      class="hover:cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                      Editar
                    </button>
                    
                    <button
                      @click="openAlertDeleteBuchaModal(bucha)"
                      class="hover:cursor-pointer inline-flex items-center gap-1.5 px-3 py-2  bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="bg-neutral-400/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 justify-between flex flex-cols-2">
            <div class="flex items-center justify-between">
              <p class="text-md text-black">
                Mostrando <span class="font-semibold">{{ buchas.length }}</span> buchas(s)
              </p>
              <!-- Aqui você pode adicionar paginação depois -->
            </div>
          </div>

        </div>



        <div
          v-if="isEditBuchaModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
        >
          <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        <!-- Header do Modal -->
        <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-black">Editar Bucha</h3>
            </div>
            <button
              @click="isEditBuchaModalOpen = false"
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
              Tipo do Bucha <span class="text-red-400">*</span>
            </label>
            <input
              v-model="editingbucha!.tipobucha"
              type="text"
              placeholder="Ex: Bucha Lateral"
              maxlength="30"
              class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
            />
            <p v-if="errorMessageBucha" class="text-red-500 text-sm mt-1">{{ errorMessageBucha }}</p>
          </div>
        </div>

        <!-- Footer com botões -->
        <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
          <div class="flex gap-3">
            <button
              @click="isEditBuchaModalOpen = false"
              class="px-6 py-2.5 hover:cursor-pointer rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="editBucha(editingbucha!)"
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
          v-if="isAlertDeleteBuchaModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
        >
          <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            
            <!-- Header do Modal -->
            <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-3xl font-bold text-black">Tem certeza que você deseja remover a bucha?</h3>
                  <!-- Mostra qual produto será excluído -->
                  <p v-if="buchaToDelete" class="text-md text-gray-600 mt-2">
                    Bucha: <span class="font-semibold">{{ buchaToDelete.tipobucha }}</span>
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
                <h1 class="text-black">Se você prosseguir, o registro da bucha será <span class="text-italic text-red-600 underline">apagado</span> <span class="text-italic text-red-600 underline">permanentemente</span>.</h1>
              </div>
            </div>

            <!-- Footer com botões -->
            <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
              <div class="flex gap-3">
                <button
                  @click="confirmDelete"
                  class="px-6 py-2.5 hover:cursor-pointer rounded-lg  bg-red-700 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Remover mesmo assim
                </button>
                <button
                  @click="closeDeleteModal"
                  class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors flex items-center gap-2"
                >
                  Cancelar
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
              placeholder="Ex: Bucha Lateral"
              maxlength="30"
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

  <Teleport to="body">
    <Transition
        enter-active-class="transform transition duration-300 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transform transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-if="toast.show"
          class="fixed bottom-6 right-6 z-[9999] max-w-sm"
        >
          <div
            class="rounded-lg shadow-2xl border overflow-hidden"
            :class="{
              'bg-emerald-50 border-emerald-500': toast.type === 'success',
              'bg-red-50 border-red-500': toast.type === 'error',
              'bg-yellow-50 border-yellow-500': toast.type === 'warning',
              'bg-blue-50 border-blue-500': toast.type === 'info'
            }"
          >
            <div class="flex items-start gap-3 p-4">
              <!-- Ícone -->
              <div class="flex-shrink-0">
                <!-- Success Icon -->
                <svg
                  v-if="toast.type === 'success'"
                  class="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <!-- Error Icon -->
                <svg
                  v-else-if="toast.type === 'error'"
                  class="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <!-- Warning Icon -->
                <svg
                  v-else-if="toast.type === 'warning'"
                  class="w-6 h-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>

                <!-- Info Icon -->
                <svg
                  v-else
                  class="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <!-- Mensagem -->
              <div class="flex-1">
                <p
                  class="font-fira text-sm font-medium"
                  :class="{
                    'text-emerald-900': toast.type === 'success',
                    'text-red-900': toast.type === 'error',
                    'text-yellow-900': toast.type === 'warning',
                    'text-blue-900': toast.type === 'info'
                  }"
                >
                  {{ toast.message }}
                </p>
              </div>

              <!-- Botão fechar -->
              <button
                @click="toast.show = false"
                class="flex-shrink-0 rounded-full p-1 transition-colors hover:cursor-pointer"
                :class="{
                  'text-emerald-600 hover:bg-emerald-100': toast.type === 'success',
                  'text-red-600 hover:bg-red-100': toast.type === 'error',
                  'text-yellow-600 hover:bg-yellow-100': toast.type === 'warning',
                  'text-blue-600 hover:bg-blue-100': toast.type === 'info'
                }"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Barra de progresso -->
            <div class="h-1 bg-white/30">
              <div
                class="h-full animate-progress"
                :class="{
                  'bg-emerald-600': toast.type === 'success',
                  'bg-red-600': toast.type === 'error',
                  'bg-yellow-600': toast.type === 'warning',
                  'bg-blue-600': toast.type === 'info'
                }"
              ></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

</template>

<style scoped>
@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-progress {
  animation: progress 3s linear forwards;
}
</style>