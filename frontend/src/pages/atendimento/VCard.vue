<template>
  <div style="min-width: 250px;">
    <div class="row">
      <div class="col-3">
        <!-- Se selectedContact.profilePicUrl existir, mostra esta imagem -->
        <q-avatar v-if="selectedContact.profilePicUrl" class="bg-grey">
          <q-img :src="selectedContact.profilePicUrl" />
        </q-avatar>
        
        <!-- Se selectedContact.profilePicUrl não existir, mas pictureUrl existir, mostra esta imagem -->
        <q-avatar v-else-if="pictureUrl" class="bg-grey">
          <q-img :src="pictureUrl" />
        </q-avatar>

        <!-- Se nem selectedContact.profilePicUrl nem pictureUrl existirem, mostra o ícone -->
        <q-icon v-else size="50px" name="mdi-account-circle" color="grey-8" />
      </div>
      <div class="col-9">
        <q-item-label class="q-mb-md text-primary" style="margin-top: 1rem;">{{ selectedContact.name }}</q-item-label>
      </div>
    </div>
    <hr />
    <!-- <q-btn full-width color="primary " style="width: 100%;margin-top: 0.5rem" icon="mdi-whatsapp" @click="handleNewChat(selectedContact)"
      :disabled="!selectedContact.number"> -->
    <q-btn full-width color="primary " style="width: 100%;margin-top: 0.5rem" icon="mdi-whatsapp" @click="handleNewChat(selectedContact)">
      <span style="margin-left: 10px;">Conversar</span>
    </q-btn>
    <!-- <q-btn full-width color="primary " style="width: 100%;margin-top: 0.5rem" icon="mdi-book-account-outline" @click="$q.screen.lt.md ? (modalNovoTicket = true) : $router.push({ name: 'chat-contatos' })"
      :disabled="!selectedContact.number">
      <span style="margin-left: 10px;">Contatos</span>
    </q-btn> -->
  </div>
</template>

<script>
import { CriarContato, ListarContatos, ListarUrlFoto, EditarContato } from 'src/service/contatos'
import { CriarTicket } from 'src/service/tickets'

export default {
  props: {
    vcard: String,
    oldTicket: {}
  },
  data() {
    return {
      contact: '',
      numbers: [],
      selectedContact: {
        name: '',
        number: 0,
        profilePicUrl: ''
      },
      pictureUrl: ''
    }
  },
  methods: {
    async fetchContact(contact, number) {
      try {
        const contatos = await ListarContatos()
        const contatoEncontrado = contatos.data.contacts.find(contato => contato.number === number[0].number.replace(/\D/g, ''));
        if (contatoEncontrado){
          const fotoPerfil = await ListarUrlFoto({number: number[0].number.replace(/\D/g, '')})
          this.pictureUrl = fotoPerfil.data
          this.selectedContact = contatoEncontrado
          return
        }
        else {
          const fotoPerfil = await ListarUrlFoto({number: number[0].number.replace(/\D/g, '')})
          this.pictureUrl = fotoPerfil.data
          const contactObj = {
            name: contact,
            number: number[0].number.replace(/\D/g, ''),
            email: '',
          }
          const { data } = await CriarContato(contactObj)
          this.selectedContact = data
        }
      } catch (err) {
        console.error(err)
      }
    },
    async handleNewChat(selectedContact) {
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario'))
        const { data: ticket } = await CriarTicket({
          contactId: selectedContact.id,
          isActiveDemand: true,
          userId: usuario.userId,
          channel: 'whatsapp',
          status: 'open'
        })
        await this.$store.commit('SET_HAS_MORE', true)
        await this.$store.dispatch('AbrirChatMensagens', ticket)
        this.$q.notify({
          message: `Atendimento Iniciado || ${ticket.contact.name} - Ticket: ${ticket.id}`,
          type: 'positive',
          progress: true,
          position: 'top',
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
        this.$router.push({ name: 'chat', params: { ticketId: ticket.id } })
      } catch (err) {
        if (err.status === 409) {
          const ticketAtual = JSON.parse(err.data.error)
          this.abrirAtendimentoExistente(selectedContact, ticketAtual)
          return
        }
        this.$notificarErro(
            'Não foi possível abrir o atendimento',
            err
          )
        console.error(err)
      }
    },
    abrirAtendimentoExistente (contato, ticket) {
      this.$q.dialog({
        title: 'Atenção!!',
        message: `${contato.name} possui um atendimento em curso (Atendimento: ${ticket.id}). Deseja abrir o atendimento?`,
        cancel: {
          label: 'Não',
          color: 'primary',
          push: true
        },
        ok: {
          label: 'Sim',
          color: 'negative',
          push: true
        },
        persistent: true
      }).onOk(async () => {
        try {
          this.abrirChatContato(ticket)
        } catch (error) {
          this.$notificarErro(
            'Não foi possível atualizar o token',
            error
          )
        }
      })
    },
    abrirChatContato (ticket) {
      if (this.$q.screen.lt.md && ticket.status !== 'pending') {
        this.$root.$emit('infor-cabecalo-chat:acao-menu')
      }
      if (!(ticket.status !== 'pending' && (ticket.id !== this.$store.getters.ticketFocado.id || this.$route.name !== 'chat'))) return
      this.$store.commit('SET_HAS_MORE', true)
      this.$store.dispatch('AbrirChatMensagens', ticket)
    },
    getInfoVCard() {
      const array = this.vcard.split('\n')
      const obj = []
      let contact = ''
      for (let index = 0; index < array.length; index++) {
        const v = array[index]
        const values = v.split(':')
        for (let ind = 0; ind < values.length; ind++) {
          if (values[ind].indexOf('+') !== -1) {
            obj.push({ number: values[ind] })
          }
          if (values[ind].indexOf('FN') !== -1) {
            contact = values[ind + 1]
          }
        }
      }
      return { contact, number: obj }
    }
  },
  created() {
    const { contact, number } = this.getInfoVCard()
    this.fetchContact(contact, number)
  }
}
</script>

<style scoped>

</style>
