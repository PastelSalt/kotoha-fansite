// Third-party stylesheets for the admin pages. Added from script (not <link> in the HTML) so the admin
// scripts never wait on Google Fonts or cdnjs — with a slow network the page stays usable, just unstyled fonts.
import { loadStylesheet } from '../shared/dom.js';

loadStylesheet('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap');
loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css', 'sha384-Gu3KVV2H9d+yA4QDpVB7VcOyhJlAVrcXd0thEjr4KznfaFPLe0xQJyonVxONa4ZC');
