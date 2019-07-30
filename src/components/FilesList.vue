<template>
  <v-card class="mx-2" outlined>
    <v-card-title>
      Files
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-search"
        label="Filter"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="files"
      :search="search"
      item-key="name"
      show-select
      class="elevation-1"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-dialog v-model="dialog" max-width="500px">
            <v-card>
              <v-card-title>
                <span class="headline">Some Title</span>
              </v-card-title>

              <v-card-text>
                <v-container grid-list-md>
                  <v-layout wrap>
                    <v-flex xs12 sm6 md4>
                      <v-text-field disabled v-model="editedItem.name" label="Name"></v-text-field>
                    </v-flex>

                    <v-flex xs12 sm6 md4>
                      <v-text-field v-model="editedItem.status" label="Status"></v-text-field>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="save">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.action="{ item }">
        <v-icon small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      selected: [],
      dialog: false,
      search: "",
      headers: [
        {
          text: "Name",
          align: "left",
          sortable: true,
          value: "name"
        },
        //{ text: "Path", value: "filePath" },
        { text: "Size", value: "size" },
        { text: "Status", value: "data.status" },
        { text: "Actions", value: "action", sortable: false }
      ],
      editedIndex: -1,
      editedItem: {
        name: "",
        size: 0,
        status: ""
      },
      defaultItem: {
        name: "",
        size: 0,
        status: ""
      }
    }
  },
  computed: {
    files() {
      return this.$store.getters.files
    },
    loading() {
      return this.$store.state.loading
    }
  },
  methods: {
    initialize() {
      console.log("initilizing...")
    },
    editItem(item) {
      this.editedIndex = this.files.indexOf(item)
      this.editedItem = Object.assign({}, { ...item, status: item.data.status })
      this.dialog = true
      console.log(this.editedIndex)
    },
    deleteItem(item) {
      console.log("deleting ", item)
    },
    close() {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      }, 300)
    },
    save() {
      this.close()
    }
  },
  watch: {
    dialog(val) {
      val || this.close()
    }
  }
}
</script>