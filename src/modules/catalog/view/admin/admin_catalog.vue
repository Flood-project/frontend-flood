<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import type { Product } from "../../domain/product"; 
import { useRouter } from "vue-router";
import { fetchProducts, updateProduct, deleteProductById } from "../../repository/product_repository";


export default defineComponent({
  setup() {
    const products = ref<Product[]>([]);
    const editingProduct = ref<Product | null>(null);

    const product = ref<Product>();

    onMounted(async () => {
      products.value = await fetchProducts();
    });

    // Excluir produto
    const deleteProduct = async (id: number) => {
      await deleteProductById(id); // chamada ao repositório / API
      products.value = products.value.filter((p) => p.id !== id);
    };

    // Editar produto
    const editProduct = (product: Product) => {
      editingProduct.value = { ...product }; // abre modal ou inline editing
    };

    // Salvar edição
    const saveProduct = async () => {
      if (editingProduct.value) {
        const updated = await updateProduct(editingProduct.value);
        // atualiza na lista
        const idx = products.value.findIndex((p) => p.id === updated.id);
        if (idx !== -1) {
          products.value[idx] = updated;
        }
        editingProduct.value = null; // fecha modal/edição
      }
    };

    return {
      product,
      products,
      editingProduct,
      deleteProduct,
      editProduct,
      saveProduct,
    };
  },
});
</script>


<!-- <template> -->
  <!-- <main class="flex min-h-screen p-4 bg-gradient-to-b from-orange-200 to-orange-850 text-emerald-950 dark:from-orange-800 dark:to-orange-900 dark:text-slate-100"> -->
    <!-- <div> -->
      <!-- <h2>Lista de Produtos</h2> -->
      <!-- <ul> -->
        <!-- <li v-for="product in products" :key="product.id"> -->
          <!-- <strong>{{ product.name }}</strong> - {{ product.description }}   -->
          <!-- (R$ {{ product.valor }}) -->
        <!-- </li> -->
      <!-- </ul> -->
    <!-- </div> -->
  <!-- </main> -->
<!-- </template> -->

<template>
  
  <main class="flex min-h-screen bg-gradient-to-b from-orange-200 to-orange-850 text-emerald-950 dark:from-gray-300 dark:to-gray-400 dark:text-slate-100">
    
    <div class="flex flex-col items-center w-full">

      <header class="bg-emerald-900 w-full h-26 flex justify-between">

      <div class="w-1/2">

        <img src="../../../../../imgstorage/logo/robustec.jpg" alt="" class="w-full h-full object-contain pb-2">

      </div>

      <div class="w-2/5">

        <h1 class="inline">teste</h1>

        <h1 class="inline">teste</h1>

        <h1 class="inline">teste</h1>

      </div>

    </header>

      <!-- título -->
      <div class="flex justify-between items-center m-10 gap-x-10"> 

        <h2 class="mb-10 text-3xl font-bold text-center text-neutral-950 mt-10">Lista de Produtos</h2>

        <button class="b-10 p-2 h-12 bg-emerald-900 text-white-900 rounded-sm hover:cursor-pointer hover:bg-emerald-700 flex space-x-2 gap-2" >

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>

          
          Adicionar Produto</button>

      </div>

      <!-- grid -->
      <div id="produtos-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center  max-w-7xl">
        
        <div v-for="product in products" :key="product.id"
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="font-fira text-emerald-800 text-sm">Novo</h1>
              <h1 class="font-fira text-zinc-800 text-xl font-semibold">Pé de Apoio {{ product.capacidade_estatica }} Kg Acionamento {{ product.id_acionamento }}</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="font-fira text-zinc-800 text-sm">Código</h1>
              <div class="flex space-x-3">
                <h1 class="font-fira text-zinc-700 font-bold text-2xl">{{ product.codigo }}</h1>
                <!-- Botões de edição e exclusão -->
                <div class="flex ml-auto">
                  <a href="">
                    <div class="relative group flex items-center justify-center">
                      <button class="b-10 p-1 bg-emerald-900 text-white-900 rounded-sm hover:cursor-pointer hover:bg-emerald-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 p-0.5" @click="editProduct(product)">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>

                      </button>

                       <span class="font-fira absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2">
                        Editar
                      </span>
                  </div>
                  </a>
                </div>
                <div>
                  <a href="">
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
                  </a>
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
             <a href="">
              <button class="font-fira bg-emerald-700 w-full py-3 rounded-lg hover:bg-emerald-900 text-white font-bold text-lg hover:cursor-pointer">
                Ver detalhes
              </button>
            </a>
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