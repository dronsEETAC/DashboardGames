<template>
    <div class="rightStyle">
        <b-table class="myTable" :items="userList" :fields="['name', 'age', 'delete']">
            <template v-slot:cell(delete)="{ item }">
                <span>
                    <b-btn @click="deleteItem(item)"> <!-- En el lloc del field delete, hi posem un boto amb una icona a dins, al clicar la icona es borrara el item (usuari de la llista) que li hem passat -->
                        <i className="bi bi-trash3-fill" style='color:red'></i>
                    </b-btn>
                </span>
            </template>
        </b-table>
    </div>
</template>

<script> // treiem la etiqueta lang="ts" pk no es queixi dels tipus de typescript en el emitter
import { defineComponent, ref, inject } from 'vue'

export default defineComponent({
    setup () {
        let userList = ref([]);
        const emitter = inject('emitter');
        emitter.on ('newUser', (user) => {
            userList.value.push(user);
            console.log("List: ", userList.value);            
        })
        function deleteItem(item){
            this.userList = this.userList.filter(user => user.name!=item.name)
        }
        return {
            userList,
            deleteItem
        }
    }
})
</script>

<style scoped>
.rightStyle{
    border-style: solid;
    border-color: blue;
    width: 50%;
}
.myTable{
    width: 50%;
    margin-left: 25%;
    margin-top: 1%;
    border-style: solid;
}

</style>