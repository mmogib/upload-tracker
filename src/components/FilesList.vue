<template>
  <v-card max-width="600" class="mx-auto">
    <v-card-title>
      <h2>Uploaded Files</h2>
    </v-card-title>
    <v-list two-line>
      <v-list-item-group active-class="pink--text">
        <template v-for="(item, index) in files">
          <v-list-item :key="item.id">
            <template v-slot:default="{ active, toggle }">
              <v-list-item-content>
                <v-list-item-title v-text="item.name"></v-list-item-title>
                <v-list-item-subtitle v-text="item.path"></v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action>
                <v-list-item-action-text v-text="item.date"></v-list-item-action-text>
                <v-icon v-if="!active" color="grey lighten-1">mdi-star</v-icon>

                <v-icon v-else color="yellow">mdi-star</v-icon>
              </v-list-item-action>
            </template>
          </v-list-item>

          <v-divider v-if="index + 1 < files.length" :key="index"></v-divider>
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
    files() {
      return this.$store.state.files
    }
  }
}
</script>