<template>
  <div class="q-pa-md">
    <transition-group appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <div v-for="(mensagem, index) in mensagens" :key="`mensagem-${index}`">
        <hr
          v-if="isLineDate"
          :key="'hr-' + index"
          class="hr-text q-mt-lg q-mb-md"
          :data-content="formatarData(mensagem.createdAt)"
          v-show="index === 0 || formatarData(mensagem.createdAt) !== formatarData(mensagens[index - 1].createdAt)"
        />
        <template v-if="mensagens.length && index === mensagens.length - 1">
          <div :key="`ref-${mensagem.createdAt}`" ref="lastMessageRef" id="lastMessageRef" style="float: 'left', background: 'black', clear: 'both'" />
        </template>
        <div :key="`chat-message-${mensagem.id}`" :id="`chat-message-${mensagem.id}`" />
        <q-chat-message
          :key="mensagem.id"
          :stamp="dataInWords(mensagem.createdAt)"
          :sent="mensagem.fromMe"
          class="text-weight-medium"
          :bg-color="mensagem.fromMe ? 'grey-2' : $q.dark.isActive ? 'blue-2' : 'blue-1'"
          :class="{ pulseIdentications: identificarMensagem == `chat-message-${mensagem.id}` }"
        >
          <!-- :bg-color="mensagem.fromMe ? 'grey-2' : 'secondary' " -->
          <div style="min-width: 100px; max-width: 350px" :style="mensagem.isDeleted ? 'color: rgba(0, 0, 0, 0.36) !important;' : ''">
            <q-checkbox
              v-if="ativarMultiEncaminhamento"
              :key="`cheked-chat-message-${mensagem.id}`"
              :class="{
                'absolute-top-right checkbox-encaminhar-right': !mensagem.fromMe,
                'absolute-top-left checkbox-encaminhar-left': mensagem.fromMe,
              }"
              :ref="`box-chat-message-${mensagem.id}`"
              @click.native="verificarEncaminharMensagem(mensagem)"
              :value="false"
            />

            <q-icon
              class="q-ma-xs"
              name="mdi-calendar"
              size="18px"
              :class="{
                'text-primary': mensagem.scheduleDate && mensagem.status === 'pending',
                'text-positive': !['pending', 'canceled'].includes(mensagem.status),
              }"
              v-if="mensagem.scheduleDate"
            >
              <q-tooltip content-class="bg-secondary text-grey-8">
                <div class="row col">Mensagem agendada</div>
                <div class="row col" v-if="mensagem.isDeleted">
                  <q-chip color="red-3" icon="mdi-trash-can-outline"> Envio cancelado: {{ formatarData(mensagem.updatedAt, 'dd/MM/yyyy') }} </q-chip>
                </div>
                <div class="row col">
                  <q-chip color="blue-1" icon="mdi-calendar-import"> Criado em: {{ formatarData(mensagem.createdAt, 'dd/MM/yyyy HH:mm') }} </q-chip>
                </div>
                <div class="row col">
                  <q-chip color="blue-1" icon="mdi-calendar-start"> Programado para: {{ formatarData(mensagem.scheduleDate, 'dd/MM/yyyy HH:mm') }} </q-chip>
                </div>
              </q-tooltip>
            </q-icon>
            <div v-if="mensagem.isDeleted" class="text-italic">Mensagem apagada em {{ formatarData(mensagem.updatedAt, 'dd/MM/yyyy') }}.</div>
            <div v-if="isGroupLabel(mensagem)" class="q-mb-sm" style="display: flex; color: rgb(59 23 251); fontweight: 500">
              {{ isGroupLabel(mensagem) }}
            </div>
            <div v-if="mensagem.quotedMsg" :class="{ textContentItem: !mensagem.isDeleted, textContentItemDeleted: mensagem.isDeleted }">
              <MensagemRespondida
                style="max-width: 240px; max-height: 150px"
                class="row justify-center"
                @mensagem-respondida:focar-mensagem="
                  f
                  carMensagem
                "
                :mensagem="mensagem.quotedMsg"
              />
            </div>
            <q-btn v-if="!mensagem.isDeleted && isShowOptions" class="absolute-top-right mostar-btn-opcoes-chat" dense flat ripple round icon="mdi-chevron-down">
              <q-menu square auto-close anchor="bottom left" self="top left">
                <q-list style="min-width: 100px">
                  <q-item :disable="!['whatsapp', 'telegram'].includes(ticketFocado.channel)" clickable @click="citarMensagem(mensagem)">
                    <q-item-section>Responder</q-item-section>
                    <q-tooltip v-if="!['whatsapp', 'telegram'].includes(ticketFocado.channel)"> Disponível apenas para WhatsApp e Telegram </q-tooltip>
                  </q-item>
                  <q-item clickable @click="encaminharMensagem(mensagem)">
                    <q-item-section>Encaminhar</q-item-section>
                  </q-item>
                  <q-item clickable @click="marcarMensagensParaEncaminhar(mensagem)">
                    <q-item-section>Marcar (encaminhar várias)</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item @click="deletarMensagem(mensagem)" clickable v-if="mensagem.fromMe" :disable="isDesactivatDelete(mensagem) || ticketFocado.channel === 'messenger'">
                    <q-item-section>
                      <q-item-label>Deletar</q-item-label>
                      <!-- <q-item-label caption>
                        Apagará mensagem: {{ isDesactivatDelete(mensagem) ? 'PARA TODOS' : 'PARAM MIN' }}
                      </q-item-label> -->
                      <!-- <q-tooltip :delay="500"
                        content-class="text-black bg-red-3 text-body1">
                        * Após 5 min do envio, não será possível apagar a mensagem. <br>
                        ** Não está disponível para Messenger.
                      </q-tooltip> -->
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-icon v-if="mensagem.fromMe" class="absolute-bottom-right q-pr-xs q-pb-xs" :name="ackIcons[mensagem.ack]" size="1.2em" :color="mensagem.ack >= 3 ? 'blue-12' : ''" />
            <!-- <template v-if="mensagem.mediaType === 'audio'">
              <div style="width: 330px; heigth: 300px">
                <audio class="q-mt-md full-width" controls ref="audioMessage" controlsList="nodownload noplaybackrate volume novolume">
                  <source :src="mensagem.mediaUrl" type="audio/ogg" />
                </audio>
              </div>
            </template> -->
            <template v-if="mensagem.mediaType === 'audio'">
                <div style="width: 330px; height: 100%">
                  <audio class="q-mt-md full-width"
                    controls
                    ref="audioMessage"
                    controlsList="nodownload noplaybackrate volume novolume">
                    <!-- <source :src="mensagem.mediaUrl.replace('.ogg', '.mp3')" type="audio/mp3" /> -->
                    <source :src="mensagem.mediaUrl.replace('.ogg', '.mp3')" type="audio/mp3" />
                  </audio>
                </div>
            </template>
            <template v-if="mensagem.mediaType === 'vcard'">
              <VCard :vcard=" mensagem.body " :oldTicket=" ticketFocado " />
              <q-btn full-width color="primary " style="width: 100%;margin-top: 0.5rem" icon="mdi-download-outline"  type="a"
                download="vCard"
                :href="`data:text/x-vcard;charset=utf-8;base64,${returnCardContato(mensagem.body)}`">
                <span style="margin-left: 10px;">Download</span>
              </q-btn>
            </template>
            <!-- <template v-if="mensagem.mediaType === 'vcard'">
              <div>
                <strong>Nome:</strong> {{ extrairLinha(mensagem.body, 'FN:') }}
              </div>
              <div>
                <strong>Contato:</strong> {{ extrairLinha(mensagem.body, 'TEL') }}
              </div>
              <br>
              <q-btn
                flat
                round
                icon="img:whatsapp-logo.png"
                @click="handleNewChat(mensagem.body)"
                v-if="mensagem.contact"
              />
              <q-btn style="margin: 3px;" flat class="bg-padrao btn-rounded" icon="mdi-book-account-outline" @click="$q.screen.lt.md ? (modalNovoTicket = true) : $router.push({ name: 'chat-contatos' })">
                <q-tooltip content-class="bg-padrao text-grey-9 text-bold"> Contatos </q-tooltip>
              </q-btn>
              <q-btn style="margin: 3px;" flat class="bg-padrao btn-rounded" icon="mdi-file-download-outline"
                type="a"
                download="vCard"
                :href="`data:text/x-vcard;charset=utf-8;base64,${returnCardContato(mensagem.body)}`">
                <q-tooltip content-class="bg-padrao text-grey-9 text-bold"> Download </q-tooltip>
              </q-btn>
            </template> -->
            <template v-if="mensagem.mediaType === 'image'">
              <!-- @click="buscarImageCors(mensagem.mediaUrl)" -->
              <q-img
                @click="
                  urlMedia = mensagem.mediaUrl
                  abrirModalImagem = true
                "
                :src="mensagem.mediaUrl"
                spinner-color="primary"
                height="150px"
                width="330px"
                class="q-mt-md"
                style="cursor: pointer"
              />
              <VueEasyLightbox moveDisabled :visible="abrirModalImagem" :imgs="urlMedia" :index="mensagem.ticketId || 1" @hide="abrirModalImagem = false" />
            </template>
            <template v-if="mensagem.mediaType === 'video'">
              <video
                :src="mensagem.mediaUrl"
                controls
                class="q-mt-md"
                style="objectfit: cover; width: 330px; height: 150px; bordertopleftradius: 8px; bordertoprightradius: 8px; borderbottomleftradius: 8px; borderbottomrightradius: 8px"
              ></video>
            </template>
            <template v-if="!['audio', 'vcard', 'image', 'video'].includes(mensagem.mediaType) && mensagem.mediaUrl">
              <div class="text-center full-width hide-scrollbar no-scroll">
                <iframe
                  v-if="isPDF(mensagem.mediaUrl)"
                  frameBorder="0"
                  scrolling="no"
                  style="width: 330px; height: 150px; overflow-y: hidden; -ms-overflow-y: hidden"
                  class="no-scroll hide-scrollbar"
                  :src="mensagem.mediaUrl"
                  id="frame-pdf"
                >
                  Faça download do PDF
                  <!-- alt : <a href="mensagem.mediaUrl"></a> -->
                </iframe>
                <q-btn
                  type="a"
                  :color="$q.dark.isActive ? '' : 'grey-3'"
                  no-wrap
                  no-caps
                  stack
                  dense
                  class="q-mt-sm text-center text-black btn-rounded text-grey-9 ellipsis"
                  download
                  :target="isPDF(mensagem.mediaUrl) ? '_blank' : ''"
                  :href="mensagem.mediaUrl"
                >
                  <q-tooltip v-if="mensagem.mediaUrl" content-class="text-bold">
                    Baixar: {{ mensagem.mediaName }}
                    {{ mensagem.body }}
                  </q-tooltip>
                  <div class="row items-center q-ma-xs">
                    <div class="ellipsis col-grow q-pr-sm" style="max-width: 290px">
                      {{ farmatarMensagemWhatsapp(mensagem.body || mensagem.mediaName) }}
                    </div>
                    <q-icon name="mdi-download" />
                  </div>
                </q-btn>
              </div>
              <!-- <q-btn
                type="a"
                color="primary"
                outline
                dense
                class="q-px-sm text-center"
                target="_blank"
                :href="`http://docs.google.com/gview?url=${mensagem.mediaUrl}&embedded=true`"
              >
                Visualizar
              </q-btn> -->
            </template>
            <template v-if="['image', 'video'].includes(mensagem.mediaType) && mensagem.mediaUrl">
              <div class="text-center full-width hide-scrollbar no-scroll">
                <q-btn
                  type="a"
                  :color="$q.dark.isActive ? '' : 'grey-3'"
                  no-wrap
                  no-caps
                  stack
                  dense
                  class="q-mt-sm text-center text-black btn-rounded text-grey-9 ellipsis"
                  download
                  :target="'_blank'"
                  :href="mensagem.mediaUrl"
                >
                  <q-tooltip v-if="mensagem.mediaUrl" content-class="text-bold">
                    Baixar: {{ mensagem.mediaName }}
                    {{ mensagem.body }}
                  </q-tooltip>
                  <div class="row items-center q-ma-xs">
                    <div class="ellipsis col-grow q-pr-sm" style="max-width: 290px">
                      {{ farmatarMensagemWhatsapp(mensagem.body || mensagem.mediaName) }}
                    </div>
                    <q-icon name="mdi-download" />
                  </div>
                </q-btn>
              </div>
              <!-- <q-btn
                type="a"
                color="primary"
                outline
                dense
                class="q-px-sm text-center"
                target="_blank"
                :href="`http://docs.google.com/gview?url=${mensagem.mediaUrl}&embedded=true`"
              >
                Visualizar
              </q-btn> -->
            </template>
            <div
              v-linkified
              v-if="!['vcard', 'application', 'audio'].includes(mensagem.mediaType)"
              :class="{ 'q-mt-sm': mensagem.mediaType !== 'chat' }"
              class="q-message-container row items-end no-wrap"
            >
              <div v-html="farmatarMensagemWhatsapp(mensagem.body)"></div>
            </div>
          </div>
        </q-chat-message>
      </div>
    </transition-group>
  </div>
</template>

<script>
// const userId = +localStorage.getItem('userId')
// import { CriarTicket } from 'src/service/tickets'
// import { mapGetters } from 'vuex'
import mixinCommon from './mixinCommon'
import axios from 'axios'
import VueEasyLightbox from 'vue-easy-lightbox'
import MensagemRespondida from './MensagemRespondida'
const downloadImageCors = axios.create({
  baseURL: process.env.URL_API,
  timeout: 20000,
  headers: {
    responseType: 'blob',
  },
})
import { DeletarMensagem, CriarTicket } from 'src/service/tickets'
import { CriarContato, ListarContatos } from 'src/service/contatos'
import VCard from './VCard.vue'
import { Base64 } from 'js-base64'
export default {
  name: 'MensagemChat',
  mixins: [mixinCommon],
  props: {
    mensagens: {
      type: Array,
      default: () => [],
    },
    mensagensParaEncaminhar: {
      type: Array,
      default: () => [],
    },
    size: {
      type: [String, Number],
      default: '5',
    },
    isLineDate: {
      type: Boolean,
      default: true,
    },
    isShowOptions: {
      type: Boolean,
      default: true,
    },
    ativarMultiEncaminhamento: {
      type: Boolean,
      default: false,
    },
    replyingMessage: {
      type: Object,
      default: () => {},
    },
  },
  // computed: {
  //   ...mapGetters(['whatsapps'])
  // },
  data() {
    return {
      abrirModalImagem: false,
      urlMedia: '',
      identificarMensagem: null,
      ackIcons: {
        // Se ACK == 3 ou 4 entao color green
        0: 'mdi-clock-outline',
        1: 'mdi-check',
        2: 'mdi-check-all',
        3: 'mdi-check-all',
        4: 'mdi-check-all',
      },
    }
  },
  components: {
    VueEasyLightbox,
    MensagemRespondida,
    VCard
  },
  methods: {
    async fetchContact(contact, waid) {
      try {
        const contatos = await ListarContatos()
        const contatoEncontrado = contatos.data.contacts.find(contato => contato.number === waid);
        if (contatoEncontrado) return;
        const contactObj = {
          name: contact,
          number: waid.replace(/\D/g, ''),
          email: ''
        }
        const { data } = await CriarContato(contactObj)
        console.log(contatoEncontrado)
        return data
      } catch (err) {
        // console.error(err)
      }
    },
    extrairLinha(msg, propriedade) {
      const linhas = msg.split('\n');
      const fn = linhas.find(linha => linha.startsWith('FN'))
      const linhaTel = linhas.find(linha => linha.includes('TEL'))
      const waid = linhaTel.match(/waid=([\d]+)/)[1];
      this.fetchContact(fn.replace('FN:', ''), waid);
      const linhaEncontrada = linhas.find(linha => linha.startsWith(propriedade));
      const linhaEncontradaTel = linhas.find(linha => linha.includes(propriedade));
      if (propriedade === 'TEL' && linhaEncontradaTel) {
        const indiceMais = linhaEncontradaTel.indexOf('+');
        return linhaEncontradaTel.slice(indiceMais);
      }
      return linhaEncontrada.replace(propriedade, '');
    },
    async handleNewChat(msg) {
      const contatos = await ListarContatos()
      const linhas = msg.split('\n');
      const linhaTel = linhas.find(linha => linha.includes('TEL'))
      const waid = linhaTel.match(/waid=([\d]+)/)[1];
      const contatoEncontrado = contatos.data.contacts.find(contato => contato.number === waid);
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario'))
        const { data: ticket } = await CriarTicket({
          contactId: contatoEncontrado.id,
          isActiveDemand: true,
          userId: usuario.userId,
          channel: 'whatsapp',
          // channelId: 1,
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
          this.abrirAtendimentoExistente(contatoEncontrado, ticketAtual)
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
    verificarEncaminharMensagem(mensagem) {
      const mensagens = [...this.mensagensParaEncaminhar]
      const msgIdx = mensagens.findIndex((m) => m.id === mensagem.id)
      if (msgIdx !== -1) {
        mensagens.splice(msgIdx, 1)
      } else {
        if (this.mensagensParaEncaminhar.length > 9) {
          this.$notificarErro('Permitido no máximo 10 mensagens.')
          return
        }
        mensagens.push(mensagem)
      }
      this.$refs[`box-chat-message-${mensagem.id}`][0].value = !this.$refs[`box-chat-message-${mensagem.id}`][0].value
      this.$emit('update:mensagensParaEncaminhar', mensagens)
    },
    marcarMensagensParaEncaminhar(mensagem) {
      this.$emit('update:mensagensParaEncaminhar', [])
      this.$emit('update:ativarMultiEncaminhamento', !this.ativarMultiEncaminhamento)
      // this.verificarEncaminharMensagem(mensagem)
    },
    isPDF(url) {
      if (!url) return false
      const split = url.split('.')
      const ext = split[split.length - 1]
      return ext === 'pdf'
    },
    isGroupLabel(mensagem) {
      try {
        return this.ticketFocado.isGroup ? mensagem.contact.name : ''
      } catch (error) {
        return ''
      }
    },
    // cUrlMediaCors () {
    //   return this.urlMedia
    // },
    returnCardContato(str) {
      // return btoa(str)
      return Base64.encode(str)
    },
    isDesactivatDelete(msg) {
      // if (msg) {
      //   return (differenceInMinutes(new Date(), new Date(+msg.timestamp)) > 5)
      // }
      return false
    },
    async buscarImageCors(imageUrl) {
      this.loading = true
      try {
        const { data, headers } = await downloadImageCors.get(imageUrl, {
          responseType: 'blob',
        })
        const url = window.URL.createObjectURL(new Blob([data], { type: headers['content-type'] }))
        this.urlMedia = url
        this.abrirModalImagem = true
      } catch (error) {
        this.$notificarErro('Ocorreu um erro!', error)
      }
      this.loading = false
    },
    citarMensagem(mensagem) {
      this.$emit('update:replyingMessage', mensagem)
      this.$root.$emit('mensagem-chat:focar-input-mensagem', mensagem)
    },
    encaminharMensagem(mensagem) {
      this.$emit('mensagem-chat:encaminhar-mensagem', mensagem)
    },
    deletarMensagem(mensagem) {
      if (this.isDesactivatDelete(mensagem)) {
        this.$notificarErro('Não foi possível apagar mensagem com mais de 5min do envio.')
      }
      // const diffHoursDate = differenceInHours(
      //   new Date(),
      //   parseJSON(mensagem.createdAt)
      // )
      // if (diffHoursDate > 2) {
      //   // throw new AppError("No delete message afeter 2h sended");
      // }
      this.$q
        .dialog({
          title: 'Atenção!! Deseja realmente deletar a mensagem? ',
          message: 'Mensagens antigas não serão apagadas no cliente.',
          cancel: {
            label: 'Não',
            color: 'primary',
            push: true,
          },
          ok: {
            label: 'Sim',
            color: 'negative',
            push: true,
          },
          persistent: true,
        })
        .onOk(() => {
          this.loading = true
          DeletarMensagem(mensagem)
            .then((res) => {
              this.loading = false
              mensagem.isDeleted = true
            })
            .catch((error) => {
              this.loading = false
              console.error(error)
              this.$notificarErro('Não foi possível apagar a mensagem', error)
            })
        })
        .onCancel(() => {})
    },
    focarMensagem(mensagem) {
      const id = `chat-message-${mensagem.id}`
      this.identificarMensagem = id
      this.$nextTick(() => {
        const elem = document.getElementById(id)
        elem.scrollIntoView()
      })
      setTimeout(() => {
        this.identificarMensagem = null
      }, 5000)
    },
  },
  mounted() {
    this.scrollToBottom()
    // this.$refs.audioMessage.forEach(element => {
    //   element.playbackRate = 2
    // })
  },
  destroyed() {},
}
</script>

<style lang="scss">
.frame-pdf {
  overflow: hidden;
}

.checkbox-encaminhar-right {
  right: -35px;
  z-index: 99999;
}

.checkbox-encaminhar-left {
  left: -35px;
  z-index: 99999;
}
</style>
