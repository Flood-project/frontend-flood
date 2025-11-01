<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { type AccountUser } from '../domain/user';
import { getUsers } from '../repository/user_repository';

export default defineComponent({
  setup() {
    const users = ref<AccountUser[]>([]);
    const total = ref(0);
    const page = ref(1)
    const limit = ref(10);
    const loading = ref(false);
    const search = ref("");
    let timeout: number | undefined
    

    const usersWithParams = async (options = {}): Promise<ProductWithComponents[]> => {
      loading.value = true;

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
    

    const fetchUsers = async () => {
      try {
        users.value = await getUsers();
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      }
    };

    onMounted(() => {
      fetchUsers();
    });

    const onSearch = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        productsWithParams({ search: search.value })
      }, 400)
    }

    return { users };
  },
});
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-orange-200 to-orange-850 text-emerald-950 dark:from-gray-300 dark:to-gray-400 dark:text-slate-100">

    <header class="bg-emerald-900 w-full h-26 flex justify-between">

      <div class="w-1/2">

        <img src="../../../../../imgstorage/logo/robustec.jpg" alt="" class="w-full h-full object-contain pb-2 ml-auto">

      </div>

      <div class="w-2/5 flex justify-end items-center gap-8 text-white mr-auto">

        <h1 class="">Produtos</h1>

        <button class="bg-emerald-950 b-10 p-2 rounded-lg border-black hover:cursor-pointer hover:bg-stone-700">Logout</button>

      </div>

    </header>

    <div class="flex flex-col items-center w-full">

      
      <!-- título -->
      <h2 class="mb-10 text-3xl font-bold text-center text-neutral-950 mt-10">Lista de Produtos</h2>

      <input
        v-model="search"
        @input="onSearch"
        type="text"
        placeholder="Buscar usuário por nome..."
        class="p-3 rounded-lg w-80 bg-white text-black font-bold mb-7"
      >
      </input>

      <!-- grid -->
      <div id="user-container" class="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-y-3 justify-items-center w-full max-w-7xl">
        
        <!-- card exemplo -->
        <div class="w-full overflow-x-auto bg-white dark:bg-gray-600 rounded-xl shadow-lg p-6">
          <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Lista de Usuários</h2>

          <table class="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <thead class="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-gray-800 dark:text-gray-100 font-semibold">
                  Nome do Usuário
                </th>
                <th class="px-4 py-2 text-left text-gray-800 dark:text-gray-100 font-semibold">
                  Tipo de Usuário
                </th>
                <th class="px-4 py-2 text-center text-gray-800 dark:text-gray-100 font-semibold">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                class="border-t border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-600 transition-colors"
              >
                <td class="px-4 py-2 text-gray-900 dark:text-gray-200 font-medium">
                  {{ user.name }}
                </td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {{ user.id_user_group }}
                </td>
                <td class="px-4 py-2 text-center">
                  <button
                    @click="editUser(user)"
                    class="bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors mr-2"
                  >
                    Editar
                  </button>
                  <button
                    @click="deleteUser(user.id)"
                    class="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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