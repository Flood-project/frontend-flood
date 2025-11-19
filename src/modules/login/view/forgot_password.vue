<script lang="ts">
import { defineComponent, ref } from "vue";
import { LoginMethod } from "../repository/login_repository";
import { useRouter } from "vue-router";
import type { AccountUser } from "../../user/domain/user";
//import type { MyClaims } from "../repository/login_repository";
import { jwtDecode } from "jwt-decode";
import { getClaims } from "../../../services/jwt_decoder";
import { router } from "../../../router";

export default defineComponent({
  setup() {
   
    const returnToLogin = async () => {

      router.push({path: '/'})

    };

    return {

        returnToLogin

    }

  },
});
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4 bg-emerald-900 text-emerald-950 dark:emerald-900 dark:text-slate-100">
    <div class="w-full max-w-lg max-h-lg lg:w-1/2">
      <!-- Card -->
      <div class="">
        <div
          class="rounded-3xl bg-neutral-200 shadow-xl ring-1 ring-black-200 backdrop-blur dark:bg-neutral-200 dark:ring-black-800 m-10 lg:w-full"
        >
          <div class="p-8">
            <!-- Logo / Marca -->
            <div
              class="mx-auto flex h-30 w-65 mb-3 items-center justify-center rounded-xl"
            >
              <img src="../../../../imgstorage/logo/robustec.jpg" alt="Robustec" class="object-contain mx-auto"/>
            </div>

            <h1 class="mb-1 text-center font-bold text-emerald-950 text-2xl tracking-tight">
              Esqueceu a senha?
            </h1>

            <p class="mb-5 text-center text-black text-sm">Entre em contato com a equipe comercial para redefinir a senha</p>

             <a href="https://wa.me/555433592200?text=Olá,%20quero%20redefinir%20minha%20senha!" target="_blank">

            <button
                class="w-full hover:cursor-pointer rounded-xl bg-emerald-900 px-4 py-2.5 text-xl font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[.99] dark:bg-emerald-800 dark:text-white dark:hover:bg-emerald-900"
              >
                Contatar equipe comercial
            </button>

             </a>

            <button
                @click="returnToLogin"
                class="mt-5 w-full hover:cursor-pointer rounded-xl px-4 py-2.5 text-xl text-white shadow-sm transition hover:bg-emerald-800 active:scale-[.99] dark:bg-neutral-500/50 dark:text-white dark:hover:bg-neutral-600/50"
              >
                Voltar para login
            </button>
            
          </div>
        </div>
      </div>
    </div>
  </main>
</template>