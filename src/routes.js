import { sections } from './data/sections.js'
import SectionView from './views/SectionView.vue'
import HomeView from './views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  ...sections.map(section => ({
    path: section.path,
    name: section.id,
    component: SectionView,
    props: { section }
  }))
]

export default routes

