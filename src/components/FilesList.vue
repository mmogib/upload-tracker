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

    <div class="text-right mr-4">
      <v-btn
        rounded
        :disabled="selected.length===0"
        color="primary"
        @click="uploadItem(selected[0])"
      >Upload</v-btn>
    </div>
    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="files"
      :single-select="true"
      :expanded.sync="expanded"
      :search="search"
      item-key="name"
      show-select
      show-expand
      @item-selected="itemSelected"
      class="elevation-1"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-dialog v-model="dialog" max-width="500px">
            <v-card>
              <v-card-title>
                <span class="headline">Edit</span>
              </v-card-title>

              <v-card-text>
                <v-container grid-list-md>
                  <v-layout wrap>
                    <v-flex xs12 sm6 md4>
                      <v-text-field disabled v-model="editedItem.name" label="Name"></v-text-field>
                    </v-flex>

                    <v-flex xs12 sm6 md4>
                      <v-text-field v-model="editedItem.data.status" label="Status"></v-text-field>
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
        <v-icon small @click="uploadItem(item)">mdi-upload</v-icon>
      </template>
      <template v-slot:expanded-item="{ files, headers }">
        <td>Path:</td>
        <td :colspan="headers.length-1">{{expanded[0] && expanded[0].filePath}}</td>
      </template>

      <template v-slot:item.data.status="{ item }">
        <span v-if="item.data.status==='uploaded'" class="success--text">
          <v-icon small class="mr-1">mdi-check</v-icon>
          {{item.data.status}}
        </span>
        <span v-if="item.data.status==='uploading'" class="red--text">
          <v-progress-linear indeterminate color="deep-purple accent-4"></v-progress-linear>
          {{item.data.status}}...
        </span>
        <span v-if="item.data.status==='Not Uploaded'">{{item.data.status}}</span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
import { ipcRenderer as ipc } from "electron"
export default {
  data() {
    return {
      selected: [],
      expanded: [],
      uploading: false,
      dialog: false,
      search: "",
      headers: [
        {
          text: "Name",
          align: "left",
          sortable: true,
          value: "name"
        },
        { text: "Size", value: "size" },
        { text: "Status", value: "data.status" },
        { text: "Actions", value: "action", sortable: false }
      ],
      editedItem: {
        name: "",
        size: 0,
        data: { status: "" }
      },
      defaultItem: {
        name: "",
        size: 0,
        data: { status: "" }
      }
    }
  },
  computed: {
    folder() {
      return this.$store.state.folder
    },
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
    itemSelected(item) {
      //console.log(item)
    },

    uploadItem(item) {
      this.updateFileState({ ...item, data: { status: "uploading" } })
      this.uploading = true
      ipc.send("upload-file", item)
    },
    editItem(item) {
      const selectedFile = this.files.filter(
        v => v.folderPath === item.folderPath && v.name === item.name
      )

      this.editedItem = { ...selectedFile[0] }
      this.dialog = true
    },
    deleteItem(item) {
      console.log("deleting ", item)
    },
    close() {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
      }, 300)
    },
    updateFileState(file) {
      const folder = this.folder
      const files = this.files.map(v => {
        if (v.id === file.id) {
          return file
        } else {
          return v
        }
      })
      this.$store.dispatch("UPDATE_FILE", {
        id: folder._id,
        files
      })
    },
    save() {
      const file = this.editedItem
      this.updateFileState(file)
      this.close()
    }
  },
  watch: {
    dialog(val) {
      val || this.close()
    }
  },
  created() {
    ipc.on("upload-finished", () => {
      this.uploading = false
      this.updateFileState({
        ...this.selected[0],
        data: { status: "uploaded" }
      })
    })
  }
}
</script>