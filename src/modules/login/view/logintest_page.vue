<script lang="ts">
import { defineComponent, ref } from "vue";
import { LoginMethod } from "../repository/login_repository";
import { useRouter } from "vue-router";
import type { AccountUser } from "../../user/domain/user";
//import type { MyClaims } from "../repository/login_repository";
import { jwtDecode } from "jwt-decode";
import { getClaims } from "../../../services/jwt_decoder";
import func from "../../../../vue-temp/vue-editor-bridge";

export default defineComponent({
  setup() {
    const email = ref("");
    const password = ref("");
    const router = useRouter();
    const showPassword = ref(false);
    const user = ref<AccountUser | null>(null);

    const emailError = ref("");
    const passwordError = ref("");

    const isRecuperarSenhaModalOpen = ref(false);

    function openRecuperarSenhaModal () {
      isRecuperarSenhaModalOpen.value = true;
    };

    function togglePassword() {
      showPassword.value = !showPassword.value;
    }

    const forgotPassword = async () => {

      router.push({path: '/esqueci-minha-senha'})

    };

    const tryLogin = async () => {

      emailError.value = "";
      passwordError.value = "";

      let valid = true;

      if (!email.value || !/^[^@]+@[^@]+\.[^@]+$/.test(email.value)) {
        emailError.value = "Informe um e-mail válido.";
        valid = false;
      }

      if (!password.value || password.value.length < 6) {
        passwordError.value = "A senha deve ter ao menos 6 caracteres.";
        valid = false;
      }

      if (!valid) return; 

      try {
        const newReq = {
          email: email.value,
          password_hash: password.value,
        };

        await LoginMethod(newReq);
        const claims = getClaims();

        (email.value = ""), (password.value = "");

        if (claims?.id_user_group === 1) {
          await router.push({path: '/admin/catalog'})
        } else if (claims?.id_user_group === 2) {
          await router.push({path: '/catalogo'})
        } else if (claims?.id_user_group === 3) {
          await router.push({path: '/admin/users'})
        } else {
          router.push({path: '/'})
        }

 
      } catch (error) {
        passwordError.value = "Usuário ou senha incorretos.";
        console.log("Usuário ou senha incorretos.", error);
        
      }
    };

    return { 
      openRecuperarSenhaModal,
      isRecuperarSenhaModalOpen,
      email, 
      password, 
      tryLogin, 
      showPassword, 
      togglePassword, 
      emailError, 
      passwordError,
      forgotPassword
    };
  },
});
</script>

<!-- <template> -->
  <!-- <div class="w-full flex justify-center"> -->
    <!-- <div -->
      <!-- class="flex flex-col items-start w-80 bg-blue-400 rounded-lg mt-10 p-6" -->
    <!-- > -->
      <!-- <h2 class="mb-4 text-2xl font-bold text-white self-center">Login</h2> -->
<!--  -->
      <!-- <label class="text-xs text-gray-200 mb-1" for="email">Email</label> -->
      <!-- <input -->
        <!-- v-model="email" -->
        <!-- id="email" -->
        <!-- placeholder="exemplo@gmail.com" -->
        <!-- type="text" -->
        <!-- class="mb-4 w-full p-2 rounded-lg border-2 border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-purple-300" -->
      <!-- /> -->
<!--  -->
      <!-- <label class="text-xs text-gray-200 mb-1" for="password">Senha</label> -->
      <!-- <input -->
        <!-- v-model="password" -->
        <!-- id="password" -->
        <!-- placeholder="senha" -->
        <!-- type="password" -->
        <!-- class="mb-4 w-full p-2 rounded-lg border-2 border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-purple-300" -->
      <!-- /> -->
<!--  -->
      <!-- <button -->
        <!-- @click="tryLogin" -->
        <!-- class="w-full bg-white font-bold py-2 rounded-lg hover:bg-gray-100 transition" -->
      <!-- > -->
        <!-- Entrar -->
      <!-- </button> -->
    <!-- </div> -->
  <!-- </div> -->
<!-- </template> -->

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
              Acessar sistema
            </h1>

            <!-- Formulário -->
            <form @submit.prevent="tryLogin" class="space-y-5" novalidate>
              <div>
                <label for="email" class="mb-1 block text-lg font-medium text-black"
                  >E-mail</label
                >
                <input
                  v-model="email"
                  type="email"
                  id="email"
                  required
                  autocomplete="email"
                  placeholder="voce@exemplo.com"
                  class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                />
                <p v-if="emailError" class="mt-1 text-xs text-red-600">
                  {{ emailError }}
                </p>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label for="password" class="block text-lg font-medium text-black"
                    >Senha</label
                  >
                  <button
                    type="button"
                    @click="togglePassword"
                    class="text-xs font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-700"
                  >
                    {{ showPassword ? "ocultar senha" : "mostrar senha" }}
                  </button>
                </div>
                <div class="relative">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    required
                    minlength="6"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    class="w-full text-black placeholder:text-gray-500 focus:placeholder:text-gray-300 caret-black rounded-xl border border-black-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-black-500 focus:ring-2 focus:ring-black-200 dark:border-black-700 dark:bg-white dark:focus:border-emerald-400 dark:focus:ring-emerald-800"
                  />
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="h-4 w-4"
                    >
                      <path
                        d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 1 0 12 2Z"
                      />
                    </svg>
                  </div>
                </div>
                <p v-if="passwordError" class="mt-1 text-xs text-red-600">
                  {{ passwordError }}
                </p>
              </div>

              <!-- <div class="flex items-center justify-between">
                <label
                  class="inline-flex items-center gap-2 text-sm text-orange-600 dark:text-orange-300"
                >
                  <input
                    v-model="remember"
                    type="checkbox"
                    class="h-4 w-4 rounded border-orange-300 text-orange-700 focus:ring-orange-400 dark:border-orange-700 dark:bg-orange-900"
                  />
                  Manter conectado
                </label>
                <a
                  href="#"
                  class="text-sm font-medium text-orange-700 underline-offset-2 hover:underline dark:text-orange-200"
                  >Esqueci minha senha</a
                >
              </div> -->

              <button
                type="submit"
                class="mt-2 w-full hover:cursor-pointer rounded-xl bg-emerald-900 px-4 py-2.5 text-xl font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[.99] dark:bg-emerald-800 dark:text-white dark:hover:bg-emerald-900"
              >
                Entrar
              </button>

              <div class="text-center">

                <button @click="forgotPassword">

                <h3 class="text-md text-emerald-800 font-semibold hover:cursor-pointer">Esqueci minha senha</h3>

                </button>

              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>


<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px rgba(6, 78, 59, 0.5) inset !important;
  box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.5) inset !important;
  -webkit-text-fill-color: rgb(0, 0, 0) !important;
  caret-color: rgb(0, 0, 0) !important;
  border-color: rgba(0, 0, 0, 0.5) !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
