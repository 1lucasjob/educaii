Adicionar botão de mostrar/ocultar senha no formulário de Login (`src/pages/Login.tsx`):

1. Importar `Eye` e `EyeOff` de `lucide-react`.
2. Adicionar estado `const [showPwd, setShowPwd] = useState(false);`.
3. Envolver o `<Input>` da senha em uma `div className="relative"`:
   - Trocar `type="password"` por `type={showPwd ? "text" : "password"}` e adicionar `className="pr-10"`.
   - Adicionar `<button type="button">` posicionado em `absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground` com `aria-label` dinâmico ("Mostrar senha"/"Ocultar senha") e ícone `Eye`/`EyeOff` (w-4 h-4).

Não altera lógica de submit, validação, rotas ou outros formulários.