import request from 'src/service/request'

export function VerificarToken () {
  return request({
    url: `/wabameta/1`,
    method: 'get',
    
  })
}

export function VerificarTelefone (data) {
  return request({
    url: `/wabametaVerifyPhone`,
    method: 'post',
    data
  })
}

export function EnviarTextoWaba (data) {
  return request({
    url: '/wabametaText',
    method: 'post',
    data
  })
}

export function EnviarArquivoWaba (data) {
  return request({
    url: '/wabametaFile',
    method: 'post',
    data
  })
}