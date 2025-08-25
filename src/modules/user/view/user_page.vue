<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { type AccountUser } from '../domain/user';
import { getUsers } from '../repository/user_repository';

export default defineComponent({
  setup() {
    const users = ref<AccountUser[]>([]);

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

    return { users };
  },
});
</script>

<template>
     <div>
    <h1>Lista de Usuários</h1>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </li>
    </ul>
  </div>
</template>