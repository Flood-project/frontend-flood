<script lang="ts">
import { defineComponent, ref, onMounted, computed, onUnmounted, watch } from "vue";
import { fetchLogs } from "../../repository/admin/audit_logs_repository";
import type { AuditLog } from "../../domain/admin/audit";
import { getUsers } from "../../../user/repository/user_repository";
import { removeAccessTokens } from "../../../../services/token";
import { router } from "../../../../router";
import { getClaims } from "../../../../services/jwt_decoder";


export default defineComponent({
  setup() {

    const isLoading = ref(true);

    const logs = ref<{ id: number;
  table_name: string;
  operation: string;
  user_id: number;  
  user_email: string;
  ip_address: string;
  user_agent: string;
  created_at: string; }[]>([]);

  const users = ref([]);
  const userMap = ref<Record<number, string>>({});

    // const isLoading = ref(true);

    onMounted(async () => {
      const [logsData, usersData] = await Promise.all([
        fetchLogs(),
        getUsers()
      ]);

      logs.value = logsData;
      users.value = usersData;

      // cria o map id → nome
      usersData.forEach((u: any) => {
        userMap.value[u.id] = u.name;
      });
      isLoading.value = false
    });

    const formatDate = (date: string) => {
      return new Date(date).toLocaleString('pt-BR');
    };

    const getUserName = (id: number) => {
      return userMap.value[id] || `Usuário #${id}`;
    };

    const getOperationColor = (operation: string) => {
      switch (operation) {
        case 'INSERT': return 'text-green-600 font-semibold';
        case 'UPDATE': return 'text-blue-600 font-semibold';
        case 'DELETE': return 'text-red-600 font-semibold';
        default: return '';
      }
    }

    const redirectToHomePage = async () => {

      const claims = getClaims();

      if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/catalog'})
        } else {
          router.push({path: '/'})
        }

    };

    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }

    return {
      isLoading,
      getUserName,
      getOperationColor,
      formatDate,
      logs,
      redirectToHomePage,
      logout
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


    <header class="mb-10 bg-gray-200 w-full h-28 flex items-center justify-center shadow-md rounded-xl px-8">

      <div class="w-full max-w-screen-2xl px-4 flex items-center justify-between">

      
          <div class="flex items-center justify-start">
            <img 
              src="../../../../../imgstorage/logo/robustec.jpg" 
              alt="Logo" 
              class="h-28 object-contain mx-auto"
            >
          </div>

 
          <h2 class="text-3xl font-bold text-neutral-950 text-center flex-1">
            Auditoria - Registros de alterações
          </h2>

          <div class="flex justify-end items-center gap-6">

            <button
              @click="redirectToHomePage"
              class="text-white font-semibold flex flex-col-2 gap-3 bg-emerald-800 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer hover:bg-emerald-700"
            >
              Página Inicial
            </button>

            <button
              @click="logout"
              class="text-white bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
            >
              Sair
            </button>

          </div>

        </div>

      </header>

      <div class="w-full max-w-screen-2xl mx-auto px-4 mt-10">
      <div class="rounded-2xl overflow-hidden">

        <!-- Header -->
        <div class="bg-neutral-400/50 px-6 py-5 border-b border-gray-200 dark:border-gray-600">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="w-full sm:w-auto flex-1 max-w-md">
              <div class="flex items-center gap-3">
                <svg class="w-7 h-7 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-width="2" d="M4 4h16v16H4z"/>
                </svg>
                <h1 class="text-black text-3xl">Logs de Auditoria</h1>
              </div>
            </div>
          </div>
        </div>

         <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
    <thead class="bg-neutral-400/50">
      <tr>
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Data/Hora
        </th>
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Tabela
        </th>
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Operação
        </th>
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Usuário
        </th>
      </tr>
    </thead>

    <tbody class="bg-neutral-200 dark:bg-neutral-300 divide-y divide-gray-200 dark:divide-gray-700">
      <tr 
        v-for="log in logs" 
        :key="log.id" 
        class="hover:bg-gray-50 dark:hover:bg-neutral-400 transition-colors"
      >
        <td class="px-6 py-4 whitespace-nowrap text-black">
          {{ formatDate(log.created_at) }}
        </td>

        <td class="px-6 py-4 whitespace-nowrap text-black">
          {{ log.table_name }}
        </td>

        <td class="px-6 py-4 whitespace-nowrap">
          <span :class="getOperationColor(log.operation)" class="font-semibold">
            {{ log.operation }}
          </span>
        </td>

        <td class="px-6 py-4 whitespace-nowrap text-black">
          {{ getUserName(log.user_id) }}
        </td>
      </tr>
    </tbody>
  </table>

    <div class="bg-neutral-400/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-between">
    <p class="text-md text-black">
      Mostrando <span class="font-semibold">{{ logs.length }}</span> log(s)
    </p>
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
  </main>
</template>