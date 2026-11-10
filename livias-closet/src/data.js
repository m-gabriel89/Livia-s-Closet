import LOGO from "./assets/logo.png";
export { LOGO };

export const WA="5500000000000"; // troque pelo WhatsApp da loja (55 + DDD + número)
export const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const CATS=['Todos','Vestidos','Blusas','Calças','Conjuntos','Acessórios'];
export const P=[
{id:1,n:'Vestido Aurora Midi',c:'Vestidos',p:289.9,o:349.9,t:'Novo',g:['#e8a58f','#f6cfc4'],cl:[['Rosé','#e8a58f'],['Areia','#e9d3b8'],['Vinho','#7d3b45']]},
{id:2,n:'Vestido Seda Rosé',c:'Vestidos',p:359.9,g:['#d9998a','#f3c5bb'],cl:[['Rosé','#d9998a'],['Champagne','#ecd6b8']]},
{id:3,n:'Blusa Lumière Cetim',c:'Blusas',p:159.9,g:['#efc3a9','#fbe0d2'],t:'Best-seller',cl:[['Nude','#efc3a9'],['Branco','#fdf6f2'],['Cobre','#b9785a']]},
{id:4,n:'Blusa Laço Delicada',c:'Blusas',p:129.9,o:159.9,g:['#f3b9b4','#fde1dd'],t:'-20%',cl:[['Blush','#f3b9b4'],['Off-white','#f6ece4']]},
{id:5,n:'Calça Alfaiataria Nude',c:'Calças',p:219.9,g:['#c99a7e','#e8c8b1'],cl:[['Nude','#c99a7e'],['Grafite','#5a4a47']]},
{id:6,n:'Conjunto Linho Areia',c:'Conjuntos',p:329.9,g:['#d8b392','#f0dcc6'],t:'Novo',cl:[['Areia','#d8b392'],['Rosé','#e8a58f']]},
{id:7,n:'Conjunto Tricot Pétala',c:'Conjuntos',p:299.9,g:['#e5a1a8','#f8d3d6'],cl:[['Pétala','#e5a1a8'],['Creme','#f3e6d6']]},
{id:8,n:'Bolsa Mini Ouro Rosé',c:'Acessórios',p:189.9,g:['#b9785a','#e3a98a'],cl:[['Ouro rosé','#c98a6b'],['Nude','#e8c8b1']]}
];
export const SZ=p=>Object.keys(p.st);
// Senha provisória da área da equipe (#admin). Troque antes de publicar.
export const ADMIN_PIN='livia2026';
export const grad=p=>`linear-gradient(145deg,${p.g[0]},${p.g[1]})`;
