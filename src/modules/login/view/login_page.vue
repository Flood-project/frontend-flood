<script lang="ts">
import { defineComponent, ref } from "vue";
import { LoginMethod } from "../repository/login_repository";
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const email = ref("");
    const password = ref("");
    const router = useRouter();

    const tryLogin = async () => {
      try {
        const newReq = await LoginMethod({
          email: email.value,
          password_hash: password.value,
        });
        console.log("login feito ", newReq);
        (email.value = ""), (password.value = "");
        router.push({path: '/logado'})
      } catch (error) {
        console.log("Usuário ou senha incorretos.", error);
      }
    };

    return { email, password, tryLogin };
  },
});
</script>

<template>
  <div class="w-full flex justify-center align-center">
    <h4>no access</h4>
    <!-- <div
      class="flex flex-col items-start w-80 bg-blue-400 rounded-lg mt-10 p-6"
    >
      <h2 class="mb-4 text-2xl font-bold text-white self-center">Login</h2>

      <label class="text-xs text-gray-200 mb-1" for="email">Email</label>
      <input
        v-model="email"
        id="email"
        placeholder="exemplo@gmail.com"
        type="text"
        class="mb-4 w-full p-2 rounded-lg border-2 border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-purple-300"
      />

      <label class="text-xs text-gray-200 mb-1" for="password">Senha</label>
      <input
        v-model="password"
        id="password"
        placeholder="senha"
        type="password"
        class="mb-4 w-full p-2 rounded-lg border-2 border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-purple-300"
      />

      <button
        @click="tryLogin"
        class="w-full bg-white font-bold py-2 rounded-lg hover:bg-gray-100 transition"
      >
        Entrar
      </button>
    </div> -->
  </div>
</template>
