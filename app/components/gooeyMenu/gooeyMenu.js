
Component({

  properties: {
    menu: {
      type: Array //  { title: '更多', icon: '', pic: 'icon.png', openType: '' },
    },
    open: {
      type: Boolean,
      value: false
    },
    gap: {
      type: Number, 
      value: 2
    },
    direction: {
      type: String,
      value: 'top' // left right up down
    },
    openButtonType: {
      type: String,
      value: 'hamburger' // hamburge icon
    },
    openButtonIcon: {
      type: String
    },
    openButtonIconImage: {
      type: String
    },
    showItemTitle: {
      type: Boolean,
      value: false
    }

  },

  data: {
    isOpen: false,
    vector: {
      x: 0,
      y: 1
    },
    distance: 40
  },

  ready() {
    let vector = {}
    if (this.data.direction === 'top') {
      vector = { x: 0, y: -1 }
    } else if (this.data.direction === 'right') {
      vector = { x: 1, y: 0 }
    } else if (this.data.direction === 'bottom') {
      vector = { x: 0, y: 1 }
    } else if (this.data.direction === 'left') {
      vector = { x: -1, y: 0 }
    }
    this.setData({
      distance: this.data.gap + 40,
      vector: vector
    })
  },


  methods: {
    onTapMenu(event) {
      this.setData({
        open: !this.data.open
      })

      this.triggerEvent('change', { open: this.data.open })
    },

    onTapMenuItem(event) {
      const item = event.currentTarget.dataset.item
      const index = event.currentTarget.dataset.index

      this.triggerEvent('tapItem', { item: item, index: index })
    }
  }
})
