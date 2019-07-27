<template>
  <v-container>
    <v-layout text-center wrap>
      <v-flex xs12></v-flex>

      <v-flex xs12 mb-4>
        <h1 class="display-2 font-weight-bold mb-3">Tracking File Uploads</h1>
      </v-flex>
      <v-flex xs12>
        <v-file-input
          v-model="file"
          placeholder="Select your files"
          prepend-icon="mdi-paperclip"
          :display-size="1000"
          color="deep-purple accent-4"
          label="File input"
          @change="uploadFile"
        ></v-file-input>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { mapActions } from "vuex"
export default {
  data: () => ({
    file: []
  }),
  methods: {
    ...mapActions({ addFile: "ADD_FILE" }),
    uploadFile(file) {
      if (file) {
        const { name, path } = file
        const date = new Date().toISOString()
        const newfile = {
          id: `${name}-${date}`,
          date,
          name,
          path
        }
        this.addFile(newfile)
      }
    }
  }
}
</script>
