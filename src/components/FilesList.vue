<template>
  <v-card max-width="600" class="mx-auto">
    <v-card-title>
      <h2>Uploaded Files</h2>
    </v-card-title>
    <v-list two-line>
      <v-list-item-group multiple v-model="selected" active-class="pink--text">
        <template v-for="(item, index) in folder.files">
          <v-list-item :key="item.id">
            <template v-slot:default="{ active, toggle }">
              <v-list-item-content>
                <v-list-item-title v-text="item.name"></v-list-item-title>
                <v-list-item-subtitle v-text="folder.createdAt"></v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action>
                <v-checkbox v-model="active" color="primary" @click="toggle"></v-checkbox>
                <v-list-item-action-text v-text="folder.createdAt"></v-list-item-action-text>
                <v-icon v-if="!active" color="grey lighten-1">mdi-star</v-icon>

                <v-icon v-else color="yellow">mdi-star</v-icon>
              </v-list-item-action>
            </template>
          </v-list-item>

          <v-divider v-if="index + 1 < folder.files.length" :key="index"></v-divider>
        </template>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script>
export default {
  data: () => ({
    selected: []
  }),
  computed: {
    folder() {
      return this.$store.state.folder
    }
  }
}
</script>