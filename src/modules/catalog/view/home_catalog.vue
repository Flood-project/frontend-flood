<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import type { Product } from "../domain/product"; 
import { useRouter } from "vue-router";
import { fetchProducts } from "../repository/product_repository";


export default defineComponent({
  setup() {
    const products = ref<Product[]>([]);

    onMounted(async () => {
      products.value = await fetchProducts();
    });

    return {
      products,
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
  <main class="flex min-h-screen p-6 bg-gradient-to-b from-orange-200 to-orange-850 text-emerald-950 dark:from-gray-300 dark:to-gray-400 dark:text-slate-100">
    <div class="flex flex-col items-center w-full">
      <!-- título -->
      <h2 class="mb-10 text-3xl font-bold text-center text-neutral-950">Lista de Produtos</h2>

      <!-- grid -->
      <div id="carros-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center w-full max-w-7xl">
        
        <!-- card exemplo -->
        <div
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio 1.500 Kg Acionamento Superior RAL-552</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Valor</h1>
              <h1 class="text-zinc-700 font-bold text-2xl">R$ 17.000.000,00</h1>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="bg-emerald-700 w-full py-3 rounded-lg hover:bg-gray-900 text-white font-bold text-lg">
              Ver detalhes
            </button>
          </div>
        </div>

        <div
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio 1.500 Kg Acionamento Superior RAL-552</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Valor</h1>
              <h1 class="text-zinc-700 font-bold text-2xl">R$ 17.000.000,00</h1>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="bg-emerald-700 w-full py-3 rounded-lg hover:bg-gray-300 text-white font-bold text-lg">
              Ver detalhes
            </button>
          </div>
        </div>


        <div
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio 1.500 Kg Acionamento Superior RAL-552</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Valor</h1>
              <h1 class="text-zinc-700 font-bold text-2xl">R$ 17.000.000,00</h1>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="bg-emerald-700 w-full py-3 rounded-lg hover:bg-gray-300 text-white font-bold text-lg">
              Ver detalhes
            </button>
          </div>
        </div>


        <div
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio 1.500 Kg Acionamento Superior RAL-552</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Valor</h1>
              <h1 class="text-zinc-700 font-bold text-2xl">R$ 17.000.000,00</h1>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="bg-emerald-700 w-full py-3 rounded-lg hover:bg-gray-300 text-white font-bold text-lg">
              Ver detalhes
            </button>
          </div>
        </div>

        <div
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio 1.500 Kg Acionamento Superior RAL-552</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Valor</h1>
              <h1 class="text-zinc-700 font-bold text-2xl">R$ 17.000.000,00</h1>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="bg-emerald-700 w-full py-3 rounded-lg hover:bg-gray-300 text-white font-bold text-lg">
              Ver detalhes
            </button>
          </div>
        </div>


        <div
          class="flex flex-col bg-white dark:bg-gray-300 rounded-xl shadow-md w-80 transition-all duration-300"
        >
          <!-- Foto -->
          <img src="../../../../imgstorage/products/beaver.webp" alt="" class="object-cover rounded-t-xl h-48 w-full">

          <!-- Conteúdo -->
          <div class="p-5 flex flex-col space-y-4">
            <!-- Tipo e nome -->
            <div>
              <h1 class="text-emerald-800 text-sm">Novo</h1>
              <h1 class="text-zinc-800 text-xl font-semibold">Pé de Apoio 1.500 Kg Acionamento Superior RAL-552</h1>
            </div>

            <!-- Preço -->
            <div>
              <h1 class="text-zinc-800 text-sm">Valor</h1>
              <h1 class="text-zinc-700 font-bold text-2xl">R$ 17.000.000,00</h1>
            </div>

            <!-- Características -->
            <!-- <div class="flex flex-col space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="font-semibold text-zinc-800">Ano/Modelo</span>
                <span class="text-emerald-800">2025</span>
              </div>
            </div> -->

            <!-- Botão -->
            <button class="bg-emerald-700 w-full py-3 rounded-lg hover:bg-gray-300 text-white font-bold text-lg">
              Ver detalhes
            </button>
          </div>
        </div>

        <!-- Repita o card ou use v-for -->
        
      </div>
    </div>
  </main>
</template>