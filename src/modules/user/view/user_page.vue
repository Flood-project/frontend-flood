<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue'
import { type AccountUser } from '../domain/user';
import { type EditingUser } from '../domain/user';
import { type CreatedUser } from '../domain/user';
import { createUser, getUsers, updateUser, withParams } from '../repository/user_repository';
import { removeAccessTokens } from '../../../services/token';
import { router } from '../../../router';
import { useRouter } from "vue-router";
import { getClaims } from "../../../services/jwt_decoder";




export default defineComponent({
  setup() {



    const confirmedPassword = ref("");
    
    const users = ref<AccountUser[]>([]);
    
    const total = ref(0);
    const page = ref(1)
    const limit = ref(10);
    const loading = ref(true);
    const search = ref("");
    let timeout: number | undefined

    const showPassword = ref(false);


    const newUser = ref<CreatedUser | null>(null);

    newUser.value = { name: "", email: "", id_user_group: 0, passwordHash: ""};


    const editingUser = ref<EditingUser | null>(null);
    

    // const gruposUsuario = ref< { id: number; tipobucha: string } []>([]);
    // const newGrupoUsuario = ref<Bucha | null>(null);
    // const selectedGrupoUsuario = ref<{ id: number; tipobucha: string } | null>(null);
    // const showGrupoUsuarioDropdown = ref(false);
    // const grupoUsuarioSearchTerm = ref("");

    const isEditUserModalOpen = ref (false);
    
    const isAddUserModalOpen = ref (false);

    const passwordError = ref("");

    // Validações em tempo real usando computed
    const hasSixCharacters = computed(() => {
      return (newUser.value?.passwordHash?.length || 0) >= 6;
    });

    const hasUpperCase = computed(() => {
      return /[A-Z]/.test(newUser.value?.passwordHash || '');
    });

    const hasNumber = computed(() => {
      return /[0-9]/.test(newUser.value?.passwordHash || '');
    });

    // Verifica se todas as condições foram atendidas
    const isPasswordValid = computed(() => {
      return hasSixCharacters.value && hasUpperCase.value && hasNumber.value;
    });

    function togglePassword() {
      showPassword.value = !showPassword.value;
    }

    function openAddUserModal() {

      newUser.value = { name: "", email: "", id_user_group: 0, passwordHash: ""};

      isAddUserModalOpen.value = true;
    }

    const validatePassword = (pwd: string): { valid: boolean; error: string } => {
      if (!pwd) {
        return { valid: false, error: "A senha é obrigatória." };
      }
      
      if (pwd.length < 6) {
        return { valid: false, error: "A senha deve ter pelo menos 6 caracteres." };
      }
      
      if (!/[A-Z]/.test(pwd)) {
        return { valid: false, error: "A senha deve conter pelo menos 1 letra maiúscula." };
      }
      
      if (!/[0-9]/.test(pwd)) {
        return { valid: false, error: "A senha deve conter pelo menos 1 número." };
      }

      return { valid: true, error: "" };
    };

    const addUser = async (newUser: CreatedUser) => {
      passwordError.value = "";
      
      // Validação 1: Senhas coincidem?
      if (newUser.passwordHash !== confirmedPassword.value) {
        passwordError.value = "As senhas não coincidem.";
        return;
      }

      // Validação 2: Senha forte?
      const validation = validatePassword(newUser.passwordHash);
      if (!validation.valid) {
        passwordError.value = validation.error;
        return;
      }

      // Validação 3: Email válido?
      if (!newUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
        passwordError.value = "Email inválido.";
        return;
      }

      try {
        loading.value = true;
        await createUser(newUser);
        
        isAddUserModalOpen.value = false;
        confirmedPassword.value = "";
        newUser.passwordHash = "";
        
        alert("Usuário criado com sucesso!");
        
      } catch (error: any) {
        if (error.response?.status === 409) {
          passwordError.value = "Este email já está cadastrado.";
        } else if (error.response?.data?.message) {
          passwordError.value = error.response.data.message;
        } else {
          passwordError.value = "Erro ao criar usuário. Tente novamente.";
        }
        console.error("Erro ao criar usuário:", error);
        
      } finally {
        loading.value = false;
      }
    };

    function openEditUserModal(user: AccountUser) {

      editingUser.value = user;

      isEditUserModalOpen.value = true
    };

    const editUser = async (editingUser: AccountUser) => {
      console.log(editingUser);
      if (editingUser) {
        await updateUser(editingUser.id, editingUser);
        // atualiza na lista
        isEditUserModalOpen.value = false // fecha modal/edição
      }
    };

    const usersWithParams = async (options = {}): Promise<AccountUser[]> => {
      loading.value = true;

      try {
        const data = await withParams({
          page: 1,
          limit: 10,
          ...options
        });

        console.log(data);
        users.value = data.users_with_params
        page.value = data.page
        limit.value = data.limit
        return data.users_with_params
      } catch (err) {
        console.log("Erro ao listar com parâmetros, ", err)
        return []
      } finally {
        loading.value = false;
      }
    }
    

    const fetchUsers = async () => {
      try {
        users.value = await getUsers();
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      }
    };

    const redirectToProducts = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 3) {
          await router.push({path: '/catalogo'})
        } else {
          router.push({path: '/'})
        }

    };

    onMounted( async () => {
      fetchUsers();
      users.value = await usersWithParams({ page: page.value, limit: limit.value });
      await new Promise(resolve => setTimeout(resolve, 3000))
      loading.value = false
    });

    const onSearch = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        usersWithParams({ search: search.value })
      }, 400)
    }

    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }

    return { 
      hasSixCharacters,
      hasUpperCase,
      hasNumber,
      isPasswordValid,
      togglePassword,
      showPassword,
      loading,
      logout,
      users,
      isEditUserModalOpen,
      openEditUserModal,
      editUser,
      editingUser,
      onSearch,
      search,
      isAddUserModalOpen,
      openAddUserModal,
      addUser,
      newUser,
      confirmedPassword,
      passwordError,
      redirectToProducts
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
        v-if="loading"
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
            Gerenciar Usuários
          </h2>

          <!-- Ações à direita -->
          <div class="flex justify-end items-center gap-6">

            <button
              @click="redirectToProducts"
              class="text-white bg-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors hover:cursor-pointer"
            >
              Visualizar Produtos
            </button>

            <button
              @click="logout"
              class="text-white bg-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors hover:cursor-pointer"
            >
              Sair
            </button>

          </div>

        </div>

      </header>

      <div class="w-full max-w-screen-2xl px-4 mx-auto">

        <!-- Título alinhado -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-black">Lista de Usuários</h2>
        </div>

      </div>

      <!-- grid -->
      <div id="user-container" class="grid grid-cols-1 shadow-2xl rounded-2xl sm:grid-cols-1 lg:grid-cols-1 gap-y-3 justify-items-center w-full max-w-screen-2xl mx-auto">
        
        <!-- card exemplo -->
        <div class="w-full bg-neutral-200 dark:bg-neutral-200 rounded-2xl shadow-4xl overflow-hidden">

          <div class="bg-neutral-400/50 px-6 py-5 border-b border-gray-200 dark:border-gray-600">
            
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              <!-- Search -->
              <div class="w-full sm:w-auto flex-1 max-w-md">
                <div class="relative">
                  <input
                    v-model="search"
                    @input="onSearch"
                    type="text"
                    placeholder="Buscar usuário por nome..."
                    class="w-full px-4 py-3 pl-10 bg-white dark:bg-white caret-black border border-black dark:border-black rounded-lg text-black dark:text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
              </div>

              <!-- Botão Novo Usuário -->
              <button
                @click="openAddUserModal()"
                class="w-full hover:cursor-pointer sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Novo Usuário
              </button>
            </div>
          </div>

          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead class="bg-neutral-400/50">
              <tr>
                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-black dark:text-black uppercase tracking-wider">
                  Nome do Usuário
                </th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-black dark:text-black uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-black dark:text-black uppercase tracking-wider">
                  Tipo de Usuário
                </th>
                <th scope="col" class="px-6 py-4 text-center text-xs font-bold text-black dark:text-black uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody class="bg-neutral-200 dark:bg-neutral-300 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-gray-50 dark:hover:bg-neutral-400 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-neutral-400 dark:bg-black-900/30 rounded-full flex items-center justify-center">
                      <span class="text-black dark:text-black font-semibold text-sm">
                        {{ user.name.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div class="ml-4">
                      <div class="text-md font-medium text-black">
                        {{ user.name }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-md text-black">{{ user.email }}</div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-300': user.id_user_group === 1,
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300': user.id_user_group === 2,
                      'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-300': user.id_user_group === 3
                    }"
                  >
                    {{ user.group_name }}
                  </span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditUserModal(user)"
                      class="hover:cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                      Editar
                    </button>
                    
                    <button
                      @click="deleteUser(user.id)"
                      class="hover:cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="bg-neutral-400/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 justify-between flex flex-cols-2">
            <div class="flex items-center justify-between">
              <p class="text-md text-black">
                Mostrando <span class="font-semibold">{{ }}</span> usuário(s)
              </p>
              <!-- Aqui você pode adicionar paginação depois -->
            </div>

            <div class="flex flex-cols-2">

              <svg class="hover:cursor-pointer w-8 h-8 text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14 8-4 4 4 4"/>
              </svg>
              
              <svg class="hover:cursor-pointer w-8 h-8 text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 16 4-4-4-4"/>
              </svg>

            </div>
          </div>

        </div>

       <div
          v-if="isAddUserModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
        >
          <div class="relative bg-neutral-200 rounded-4xl shadow-2xl w-full max-w-2xl overflow-hidden">
            
            <!-- Header do Modal -->
            <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-2xl font-bold text-black">Novo Usuário</h3>
                </div>
                <button
                  @click="isAddUserModalOpen = false"
                  class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
                  :disabled="loading"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-black">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="px-6 py-6 space-y-6">
              
              <!-- Seção: Informações Pessoais -->
              <div>
                <h4 class="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Informações Pessoais
                </h4>
                
                <div class="space-y-4">
                  <!-- Nome -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Nome Completo <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="newUser!.name"
                      type="text"
                      placeholder="Ex: João Silva"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                      :disabled="loading"
                    />
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Email <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="newUser!.email"
                      type="email"
                      placeholder="Ex: joao.silva@empresa.com"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                      :disabled="loading"
                    />
                  </div>

                  <!-- Cargo -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Nível de Acesso <span class="text-red-400">*</span>
                    </label>
                    <select
                      v-model="newUser!.id_user_group"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                      :disabled="loading"
                    >
                      <option value="" disabled class="bg-white text-black">Selecione o nível de acesso</option>
                      <option value="1" class="bg-white hover:bg-gray-200 text-black hover:cursor-pointer">Administrador</option>
                      <option value="2" class="bg-white hover:bg-gray-200 text-black hover:cursor-pointer">Usuário Normal</option>
                      <option value="3" class="bg-white hover:bg-gray-200 text-black hover:cursor-pointer">Comercial</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Seção: Segurança -->
              <div>
                <h4 class="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Segurança
                </h4>

                <div class="space-y-4">
                  <!-- Senha -->
                  <div>
                    <div class="mb-1 flex items-center justify-between">
                      <label class="block text-sm font-medium text-black mb-2">
                        Senha <span class="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        @click="togglePassword"
                        class="text-xs font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-700"
                      >
                        {{ showPassword ? "Ocultar senha" : "Mostrar senha" }}
                      </button>
                    </div>
                    <input
                      v-model="newUser!.passwordHash"
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      required
                      minlength="6"
                      placeholder="Digite a senha"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                      :disabled="loading"
                    />
                  </div>
                  
                  <!-- Confirmar Senha -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Confirmar Senha <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="confirmedPassword"
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      required
                      minlength="6"
                      placeholder="Digite a senha novamente"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                      :disabled="loading"
                    />
                  </div>

                  <!-- Requisitos de senha -->
                  <div class="bg-gray-200 border border-black rounded-lg p-4">
                    <p class="text-black text-xs font-medium mb-2">A senha deve conter:</p>
                    <ul class="space-y-1 text-black text-xs">
                      
                      <!-- Mínimo 6 caracteres -->
                      <li class="flex items-center gap-2">
                        <svg 
                          v-if="hasSixCharacters" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke-width="2" 
                          stroke="currentColor" 
                          class="w-3 h-3 text-green-700"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <svg 
                          v-else
                          class="w-3 h-3 text-red-600" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <span :class="hasSixCharacters ? 'text-green-700' : 'text-red-600'">
                          Mínimo de 6 caracteres
                        </span>
                      </li>
                      
                      <!-- Letra maiúscula -->
                      <li class="flex items-center gap-2">
                        <svg 
                          v-if="hasUpperCase" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke-width="2" 
                          stroke="currentColor" 
                          class="w-3 h-3 text-green-700"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <svg 
                          v-else
                          class="w-3 h-3 text-red-600" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <span :class="hasUpperCase ? 'text-green-700' : 'text-red-600'">
                          Pelo menos 1 letra maiúscula
                        </span>
                      </li>
                      
                      <!-- Número -->
                      <li class="flex items-center gap-2">
                        <svg 
                          v-if="hasNumber" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke-width="2" 
                          stroke="currentColor" 
                          class="w-3 h-3 text-green-700"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <svg 
                          v-else
                          class="w-3 h-3 text-red-600" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <span :class="hasNumber ? 'text-green-700' : 'text-red-600'">
                          Pelo menos 1 número
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Mensagem de Erro -->
              <div v-if="passwordError" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-red-800 flex-shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p class="text-black font-semibold text-sm font-medium">Erro na validação</p>
                  <p class="text-black text-sm mt-1">{{ passwordError }}</p>
                </div>
              </div>
            </div>

            <!-- Footer com botões -->
            <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
              <div class="flex gap-3">
                <button
                  @click="isAddUserModalOpen = false"
                  class="px-5 hover:cursor-pointer py-2.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="loading"
                >
                  Cancelar
                </button>
                <button
                  @click="addUser(newUser!)"
                  class="px-5 py-2.5 rounded-lg hover:cursor-pointer bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                  :disabled="loading"
                >
                  <svg v-if="loading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {{ loading ? 'Salvando...' : 'Criar Usuário' }}
                </button>
              </div>
            </div>

          </div>
        </div>

        <div
          v-if="isEditUserModalOpen"
          class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
        >
          <div class="relative bg-neutral-200 rounded-4xl shadow-2xl w-full max-w-2xl overflow-hidden">
            
            <!-- Header do Modal -->
            <div class="bg-gray-300 px-8 py-6 border-b border-black-700/50 rounded-xl shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-2xl font-bold text-black">Editar Usuário</h3>
                </div>
                <button
                  @click="isEditUserModalOpen = false"
                  class="hover:cursor-pointer text-black/90 hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-black">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="px-6 py-6 space-y-6">
              
              <!-- Seção: Informações do Usuário -->
              <div>
                <h4 class="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Informações do Usuário
                </h4>
                
                <div class="space-y-4">
                  <!-- Nome -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Nome Completo <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="editingUser!.name"
                      type="text"
                      placeholder="Ex: João Silva"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Email <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="editingUser!.email"
                      type="email"
                      placeholder="Ex: joao.silva@empresa.com"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    />
                  </div>

                  <!-- Nível de Acesso -->
                  <div>
                    <label class="block text-sm font-medium text-black mb-2">
                      Nível de Acesso <span class="text-red-400">*</span>
                    </label>
                    <select
                      v-model="editingUser!.id_user_group"
                      class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                    >
                      <option value="" disabled class="bg-white text-black">Selecione o nível de acesso</option>
                      <option value="1" class="bg-white hover:bg-gray-200 text-black hover:cursor-pointer">Administrador</option>
                      <option value="2" class="bg-white hover:bg-gray-200 text-black hover:cursor-pointer">Usuário Normal</option>
                      <option value="3" class="bg-white hover:bg-gray-200 text-black hover:cursor-pointer">Comercial</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Informação sobre senha -->
              <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-blue-800 flex-shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <p class="text-black text-sm font-medium">Alteração de senha</p>
                  <p class="text-black text-xs mt-1">A senha não pode ser alterada por aqui. Para redefinir a senha, use a função "Redefinir Senha".</p>
                </div>
              </div>
            </div>

            <!-- Footer com botões -->
            <div class="bg-gray-300 px-8 py-6 border-t border-black-700/50 flex rounded-xl justify-end items-center">
              <div class="flex gap-3">
                <button
                  @click="isEditUserModalOpen = false"
                  class="hover:cursor-pointer px-5 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="editUser(editingUser), isEditUserModalOpen = false"
                  class="hover:cursor-pointer px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Atualizar Usuário
                </button>
              </div>
            </div>

          </div>
        </div>

        </div>

        <!-- Repita o card ou use v-for -->
      


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