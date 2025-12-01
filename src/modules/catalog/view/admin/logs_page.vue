<script lang="ts">
import { defineComponent, ref, onMounted, computed, onUnmounted, watch } from "vue";
import { fetchLogs } from "../../repository/admin/audit_logs_repository";
import type { AuditLog } from "../../domain/admin/audit";
import { getUsers } from "../../../user/repository/user_repository";
import { removeAccessTokens } from "../../../../services/token";
import { router } from "../../../../router";
import { getClaims } from "../../../../services/jwt_decoder";
import { fetchProducts } from "../../repository/product_repository";


export default defineComponent({
  setup() {

    const isLoading = ref(true);

    const isOldDataModalOpen = ref(false); // ← NOVO
    const selectedOldData = ref(''); 

    const logs = ref<{ id: number;
      table_name: string;
      record_id: number;
      operation: string;
      user_id: number;  
      user_email: string;
      old_data: string;
      new_data: string;
      changed_fields: string;
      ip_address: string;
      user_agent: string;
      created_at: string; 
    }[]>([]);

  const users = ref([]);
  const userMap = ref<Record<number, string>>({});

   const products = ref([]);
  const productMap = ref<Record<number, string>>({});

    // const isLoading = ref(true);

    onMounted(async () => {
      const [logsData, usersData, productsData] = await Promise.all([
        fetchLogs(),
        getUsers(),
        fetchProducts()
      ]);

      logs.value = logsData;
      users.value = usersData;
      products.value = productsData;

      console.log("produtos retornados", productsData)

      // cria o map id → nome
      usersData.forEach((u: any) => {
        userMap.value[u.id] = u.name;
      });

      productsData.forEach((p: any) => {
        productMap.value[p.id] = p.codigo;
      });
      isLoading.value = false

       console.log('📦 Products Data:', productsData);
        console.log('🗺️ Product Map:', productMap.value);
        console.log('📋 Logs:', logsData);

      const response = getClaims()
      if (response?.email) {
        getEmail.value = response.email
      }
    });

    const formatDate = (date: string) => {
      const logDate = new Date(date);
      const now = new Date();
      
      // Zera as horas para comparar apenas as datas
      const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Formata hora e minuto
      const time = logDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Calcula diferença em dias
      const diffTime = today.getTime() - logDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return `Hoje, às ${time}`;
      } else if (diffDays === 1) {
        return `Ontem, às ${time}`;
      } else {
        return `Há ${diffDays} dias, às ${time}`;
      }
    };

    const getUserName = (userId: number): string => {
      console.log('🔎 Buscando usuário ID:', userId);
      
      // Busca no array de usuários
      const user = users.value?.find(u => u.id === userId);
      
      if (!user) {
        console.warn('❌ Usuário não encontrado:', userId);
        return `Usuário #${userId}`;
      }
      
      console.log('✅ Usuário encontrado:', user.name || user.email);
      return user.name || user.email || `#${userId}`;
    };

    const getProductCode = (productId: number): string => {
      console.log('🔎 Buscando produto ID:', productId);
      
      // Busca no array de produtos
      const product = products.value?.find(p => p.id === productId);
      
      if (!product) {
        console.warn('❌ Produto não encontrado:', productId);
        return `Produto #${productId}`;
      }
      
      console.log('✅ Produto encontrado:', product.codigo || product.name);
      return product.codigo || product.name || `#${productId}`;
    };

    const getOperationColor = (operation: string) => {
      switch (operation) {
        case 'INSERT': return 'text-green-800 font-semibold';
        case 'UPDATE': return 'text-blue-800 font-semibold';
        case 'DELETE': return 'text-red-800 font-semibold';
        default: return '';
      }
    }

    const translateOperation = (operation: string) => {
      const translations: Record<string, string> = {
        'INSERT': 'Inclusão',
        'DELETE': 'Exclusão',
        'UPDATE': 'Alteração'
      };
      return translations[operation] || operation;
    };

    const getTableType = (tableName: string) => {
      const tableTypes: Record<string, string> = {
        'products': 'Produto',
        'accounts': 'Usuário'
      };
      return tableTypes[tableName] || tableName;
    };

    // ← NOVA FUNÇÃO: Retorna o registro alterado baseado na tabela
    const getAlteredRecord = (tableName: string, recordId: number | string) => {
      console.log('🔍 getAlteredRecord chamado:', { tableName, recordId, type: typeof recordId });
      
      // ═══════════════════════════════════════════════════════════
      // 1. Encontra o log correspondente
      // ═══════════════════════════════════════════════════════════
      const log = logs.value.find(l => 
        l.table_name === tableName && 
        (l.record_id === String(recordId) || l.record_id === recordId)
      );
      
      // ═══════════════════════════════════════════════════════════
      // 2. VALIDAÇÃO: Verifica se recordId é válido
      // ═══════════════════════════════════════════════════════════
      if (!recordId || recordId === '' || recordId === 'undefined' || recordId === 'null') {
        console.warn('⚠️ recordId inválido:', recordId);
        
        // Se for INSERT, tenta pegar dados do new_data
        if (log?.operation === 'INSERT' && log.new_data) {
          if (tableName === 'products') {
            const codigo = log.new_data.codigo;
            console.log('✅ Código recuperado do new_data:', codigo);
            return codigo || 'Novo produto';
          } else if (tableName === 'accounts') {
            const name = log.new_data.name;
            console.log('✅ Nome recuperado do new_data:', name);
            return name || 'Novo usuário';
          }
        }
        
        return 'Novo registro';
      }
      
      // ═══════════════════════════════════════════════════════════
      // 3. CONVERSÃO: Garante que recordId é um número
      // ═══════════════════════════════════════════════════════════
      const id = typeof recordId === 'string' ? parseInt(recordId, 10) : recordId;
      
      if (isNaN(id)) {
        console.warn('⚠️ recordId não é um número válido:', recordId);
        return `#${recordId}`;
      }
      
      // ═══════════════════════════════════════════════════════════
      // 4. BUSCA: Retorna código/nome baseado na tabela
      // ═══════════════════════════════════════════════════════════
      if (tableName === 'products') {
        // Tenta buscar no array de produtos primeiro
        const product = products.value?.find(p => p.id === id);
        
        if (product?.codigo) {
          console.log('✅ Produto encontrado no array:', product.codigo);
          return product.codigo;
        }
        
        // Se não encontrou, busca no log (new_data ou old_data)
        if (log) {
          const codigo = log.new_data?.codigo || log.old_data?.codigo;
          if (codigo) {
            console.log('✅ Código recuperado do log:', codigo);
            return codigo;
          }
        }
        
        console.warn('⚠️ Produto não encontrado para ID:', id);
        return `Produto #${id}`;
      } 
      
      if (tableName === 'accounts') {
        // Tenta buscar no array de usuários primeiro
        const user = users.value?.find(u => u.id === id);
        
        if (user?.name) {
          console.log('✅ Usuário encontrado no array:', user.name);
          return user.name;
        }
        
        // Se não encontrou, busca no log (new_data ou old_data)
        if (log) {
          const name = log.new_data?.name || log.old_data?.name;
          if (name) {
            console.log('✅ Nome recuperado do log:', name);
            return name;
          }
        }
        
        console.warn('⚠️ Usuário não encontrado para ID:', id);
        return `Usuário #${id}`;
      }
      
      return `#${id}`;
    };

    const filteredLogs = computed(() => {
      return logs.value.filter(log => 
        log.table_name === 'products' || log.table_name === 'accounts'
      );
    });

    const getChangedFields = (fields: string) => {
      return fields && fields.trim() !== '' ? fields : 'Nenhuma alteração encontrada';
    };

    const openOldDataModal = (oldData: string) => {
      selectedOldData.value = oldData;
      isOldDataModalOpen.value = true;
    };

    const formatOldData = (data: string) => {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return data;
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

    const logout = () => {
      console.log('ta aqui');
      
      removeAccessTokens()
      router.push({ path: '/' })
    }

    const getEmail = ref("")
    const menuOpen = ref(false);

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value;
    };

    return {
      filteredLogs,
      isOldDataModalOpen, 
      selectedOldData,
      openOldDataModal, 
      formatOldData,
      getChangedFields,
      getTableType,
      getAlteredRecord,
      translateOperation,
      isLoading,
      getUserName,
      getOperationColor,
      formatDate,
      logs,
      redirectToHomePage,
      logout,
      getEmail,
      menuOpen,
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

      
          <button @click="redirectToHomePage" class="flex items-center justify-start hover:cursor-pointer">
            
              <img 
                src="../../../../../imgstorage/logo/robustec.jpg" 
                alt="Logo" 
                class="h-28 object-contain mx-auto"
              >
            
          </button>

 
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

              <div class="relative inline-block text-left">
                <!-- Botão principal (inicial + tooltip) -->
                <div class="group relative">
                  <button
                    @click="toggleMenu"
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
      <div class="rounded-2xl overflow-hidden">

        <!-- Header -->
        <div class="bg-neutral-400/50 px-6 py-5 border-b border-gray-200 dark:border-gray-600">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="w-full sm:w-auto flex-1 max-w-md">
              <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-black mt-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z"/>
                </svg>

                <h1 class="text-black text-3xl">Registros de Auditoria</h1>
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
          Usuário
        </th>
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Produto/Usuário alterado
        </th>
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Operação
        </th>
        <!-- <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Alterações
        </th> -->
        <th class="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
          Conteúdo original
        </th>
      </tr>
    </thead>

    <tbody class="bg-neutral-200 dark:bg-neutral-300 divide-y divide-gray-200 dark:divide-gray-700">
      <tr 
        v-for="log in filteredLogs" 
        :key="log.id" 
        class="hover:bg-gray-50 dark:hover:bg-neutral-400 transition-colors"
      >

        {{ console.log('📋 Log completo:', JSON.stringify(log, null, 2)) }} 

        <td class="px-6 py-4 whitespace-nowrap text-black font-semibold">
          {{ formatDate(log.created_at) }}
        </td>

        <td class="px-6 py-4 whitespace-nowrap text-black">
          {{ getUserName(log.user_id) }}
        </td>

        <td class="px-6 py-4 whitespace-nowrap text-black">
          <div class="flex flex-col">
            <span class="font-semibold">{{ getAlteredRecord(log.table_name, log.record_id) }}</span>
            <span class="text-xs text-gray-600">{{ getTableType(log.table_name) }}</span>
          </div>
        </td>

        <td class="px-6 py-4 whitespace-nowrap">
          <span :class="getOperationColor(log.operation)" class="font-semibold">
            {{ translateOperation(log.operation) }}
          </span>
        </td>

        <!-- <td class="px-6 py-4 whitespace-nowrap text-black">
          {{ getChangedFields(log.changed_fields) }}
        </td> -->

        <td class="px-6 py-4 whitespace-nowrap text-black">
          <button
            @click="openOldDataModal(log.old_data)"
            class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors hover:cursor-pointer text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ver dados
          </button>
        </td>
      </tr>
    </tbody>
  </table>

    <div class="bg-neutral-400/50 px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-between">
    <p class="text-md text-black">
      Mostrando <span class="font-semibold">{{ filteredLogs.length }}</span> registro(s)
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


    <div
      v-if="isOldDataModalOpen"
      class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4 z-50"
      @click.self="isOldDataModalOpen = false"
    >
      <div class="relative bg-neutral-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        
        <!-- Header -->
        <div class="bg-gray-300 px-6 py-5 border-b border-gray-400 flex items-center justify-between sticky top-0">
          <div class="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-black">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 class="text-2xl font-bold text-black">Conteúdo Original</h3>
          </div>
          <button
            @click="isOldDataModalOpen = false"
            class="hover:cursor-pointer text-black hover:text-white hover:bg-gray-600 rounded-lg p-2 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Conteúdo -->
        <div class="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div v-if="selectedOldData" class="bg-gray-800 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre class="whitespace-pre-wrap break-words">{{ formatOldData(selectedOldData) }}</pre>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <p class="text-lg">Nenhum dado original registrado</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-300 px-6 py-4 border-t border-gray-400 flex justify-end sticky bottom-0">
          <button
            @click="isOldDataModalOpen = false"
            class="hover:cursor-pointer px-6 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>

  </main>
</template>