;*******************************************************************************
;                 /\______          /\______          /\________
;             __\\\___    \_    __\\\___    \_    __\\\______   \
;            |      /      /   |      /      /   |     _____/    \_
;            |     /      /____|     /      /____|     \           |
;            |     \____       :      _____/     :      \          |
;            |        /                \                 \         |
;            |       /         .        \        .        \        |
;      __   _|_     /                    \                 \      _|_   __
;   \ \\_\ \\__\  _/           :          \_     :          \_   /__// /_// /
;            |____/_ _         :______ _         :______ _         |
;               \\\____________|  \\\____________|  \\\____________|
;
;    _______      _______      _______      _______      _______      _______
; _\\\__    \___\\\__    \___\\\__    \___\\\_____ \___\\\_____ \___\\\__    \_
;|    /______/|    /      /|    /      /|       /    |       /    |    /      /
;\            |   /      /_|   /      /_|      /     |      /     |   /      /_
;|\_______    :    _____/  :   \_____/  :     /      :     /      :   \____    |
;|      /     .     \      .     \      .    /       .    /       .     /      |
;|     /             \            \         /                          /       |
;|___         :___         :___         :___\        :___         :___/    sns |
;  \\_________: \\_________: \\_________: \\_________: \\_________: \\_________|
;
;                          R E D   S E C T O R   I N C
;
; Futura 256 bytes nano intro by Baudsurfer/rsi 2016 aka olivier.poudade.free.fr
; Presented at SynchroNY demoparty 2016 New York City / United States of America
; Greetings to BonBon BReWErS CODEX Conscience Flush Lineout Mandarine Onslaught
; Paranoimia Quartex Rebels Razor1911 RiOT Titan and to all assembly programmers
; rsi.untergrund.net twitter.com/red_sector_inc facebook.com/redsectorinc ircnet
; RSI asciilogo by sEnsER/BRK vidcap youtube.com/watch?v=Y5K8yKbcc0A by Fra/MDRN
;*******************************************************************************
b equ byte                  ;,: 
w equ word                ;,?}'
d equ dword             ;=!J |
  org 100h            ;,*-. ?&
  mov al,13h          ;WP) Y9P
  int 10h            ;YP   ,W'
  mov fs,w[bx]      ;,W)  ,WW.'
  mov dx,l          ;WW) ,WWW)
  mov ax,251ch      ;7W),WWWW'
  int 21h           ;`WWWWWW'
a:and bp,0ffh        ;9---W)
  jnz c          ;,,--WPL=YXW===
  xor b[cs:l],8 ;(P),CY:,I/X'F9P
  xor w[f],4a91h;WUT===---/===9)
c:mov si,140h   ;-HP+----Y(C=9W)
  mov cl,0ffh    ;'9Y3'-'-OWPT-
e:mov bx,cx       ;'WWLUIECW
  not bl           ;(:7L7C7'
  cwd             ;,P--=YWFL
  lea ax,[di-10h] ;Y-=:9)UW:L
  div si          ;3-'9=WU/.7
  sub ax,0c8h    ;,WP9HTFUW'()
  imul ax,bx      ;9W7W))UF 9)
  add ax,3f03h    ;7WYW))PW W
  sub dx,bp        ;7WH)),WC)
f:nop               ;7L--/XY)
  nop               ;9+-,KY7)
  imul dx,bx        ;W9-Y3+7)
  add dx,8f03h      ;W'=9WI7)
  add bx,bp        ;,W  '-YY)
  mov al,dh         ;W    ::W                ,
  cmp ah,30        ;,T     :X)              ()
  jc g             ;()     '9W  'L.         ()         ,-
  add bl,ah        ;(C     =:9   '9L        ()        ,T
g:and dh,bl        ;()    ,,-7)    7WL      WW      ,F'
  add dh,al        ;()    , T9)     '9WL    --    ,YF
  test bl,0f0h     ;()    '-/(W       -==+PE9P7===O)          -,
  jnz h            ;'W, ,  T+/WX=L-. ,WP+()+3L3,),=WL  --==-T-
  sub ah,27h        ;7)    -,YW '-=9WPL+PT-- ':--L/=9WP=-'
h:or dh,ah          ;'W-,.-,++W.   WWHP    ,,-/  .9CP3)
  and dh,40h         ;W  --':-9:7=9W-T ,-=FT''=++,(TFYW=====---,
  loopz e            ;W    .-='/.  7W-,WE=--,,=-:9H=9W''~~~~~~'
  inc ah             ;()   ':'/Y,  (L-9PXWWW,YWWX,(U3C        
  xor al,bl          ;9' ,,::/Y,/,  7LW+'-'7)()-'(MWW)
  and ax,3f03h    ;,,-/:',T,'-:',) ,3WWW, .Y=W'.(+WPW)
  mul ah         ;,F=T:9/:':C' /W),WMW9PO),m-+--9+WYW)
  aam 5         ;,3Y:/--.'-,',F=FHWWE/LMWU.'--X3CWW(WL
  jz i          ;YP:/:' -/'-Y-,W-T)9X,WCWWWX=WWWW39/OW
  shld ax,cx,0ch;7WF:=,/:-:P:,P(-'))PWWHYT79WWWHPW0W7W'
  add al,10h    ;'WU7C-:=-=-C9'WF,):):H7L   '7CI7WEXP'
i:mov b[fs:di],al;7L-,Y==3F:::,=,:-/,'P=.,  ':79UWEW)
  inc di         ;'WEW9P=/,)/ -:,P: / L7:'-=,-+YMWWW)
  jnz c           ;'W)+=T,T()/-,F,,,),)  ',.-+(L=W9WW.
  xor cx,cx        ;'+C/:I'''',P:''/ '  ''9.  == '-'7-
  mov bx,28h        ;(W-+'. ,YF )/:'      ')-. ,-:FX-L
  fld d[gs:bx]      ;'WM/',/CP /,:'    ..:)  ,T','/: 'W,
j:cwd                ;W--,YXT /'')   ,P=-/',P'  '(:'  'W,
  mov ax,cx          ;(WEXWF Y' ,)  ,/'-,,YT    ///  ,,'W.
  div bx            ;,WWWWT,,' .Y:/.',,-,=',- ,YY(). +3,W)
  push dx           ;WFXF:,'P ,,)/  ,',P',,- ,FI,))) I3'W)
  cwd               ;-HP,X'',/ '  ,/,/' ,/',,P3'I(:) W) W)       /=+=,
  div bx             ;9WY).,/'  ,/'-'   ,-=9-/'Y'((',W) PW      /'  '-==L,
  push ax            ;'WY,'    ,/,P   ,YP- C/',',)( (W'(WW.    /'       '7==L.
  push dx             ;()'    /:/' ,,WT'  3F',' /)W (W (K()   /'   .        '7X
  mov si,sp           ;()   ,P,P',)T=:- ,WP'.' ,P,T (W (-9L ,Y)' ,X//, .    Y:P
  fild w[si]         ;,F   ,F,',--,/:' ,+P' '  Y):) (E' YHWLWT)-''-9/',-' ,,,WF
  fild w[si+2]      ;,P.,P,)-3-- ,-,' ,WF.    ,Y (' (L-WCTWEW30V-/',:'=/P+E7WF
  fild w[si+4]      ;W- Y,P/C)',Y',' ,WT      Y) :  (P-=Y:UW9CX)3-=- ,W:9/PXXW.
k:fld st3          ;/T./:P/)' ,P',' YW-      ,P'',  9M).())WTHW3,C'  9C9='W3WW)
  fsincos         ;,EPOP/YR. /F ,',/W)       /'  :  (W)'W979WO0=WC:,..9LPXWWP-
  fmul st0,st2    ;3H:WL-R' /' /' /WF       ,) ,,   (U'(HW=WWXO:--:,:'(W=WWF'
  fxch st1       ;,WLWWWI:,F' /-'3WF '      Y  ) ,  (),T(0)WO9YPL.' ',WP=='
  fmul st0,st3     ;--YWX-F  Y',WWT' :':   (' ()7)  (MT: WP)3C)-''  3C'
  faddp st1,st0        ;WF  /' YW--,  ,    Y  W (),YM+C' 9+I3UV:' .YP'
  fld st4             ;(T  3',H3-.. ,..  .,) ,) ()F-=T-. (0,9L,'  /P'
  fsincos             ;,W Y' 33P  .  /    Y  Y) (Y' R,:  7)Y+-),,=W'
  fmulp st4,st0       ;/',F.,W)     ,,.' ,) ,W) +)  3),  (WT9XW=3P'
  fmulp st2,st0      ;/F:T.:WF.  '..:'   :' (W. 7) '=),  'WT7WWP '
  fxch st1          ;,P,F''WF  . , :-': ,)  YC../) 'HY.   WP0WC'
  fsubp st2,st0    ;,P:9::YP   '  '('   :   W) .W)  +3)   9TLWC
  fxch st2         ;(P/Y(,P' ... '':, .,)  ,W) :3)  X+.   WFUW)
  cmc              ;'WW),I','  .., =  ':  ,O+' ,W'  )9,   99U()
  jc k              ;7W,='.,' ' :.'. . '  ,W)  =3   )+.  ,OH:O)
  fistp w[si]       ;'L,F,: '. :C::' '    (W)  9W   7+    'H,:L
  add w[si],50h      ;7W'++: .. ,':' '    YT   Y).  :-.    XU:W
  imul di,[si],140h  ;(T':,''','','       3'  ,-)   ,-'    77XW
  fistp w[si]        ;(W),J.-:/-:))'      P   )9)   :,Y  .  T,9)
  add di,[si]        ;(WUI:TY:,,,:,      /' ,- W)   YC:     9/7)
  fistp w[si]        ;(U),-:-''.'=      (:,F' (W)   ,Y.     3=:L
  lodsb               ;(),:::',)/'    ,,F9W'  YW)   /L.    .7=9W,
  add al,[fs:di+bx]   ;(LUL-L.T-'.' ,WXM(W)   3W)   'U.     ,)-W
  shr al,4            ;3X=((:,' ' ,WMWF-(+'   WW'   '=,'    ,ICW
  xor al,18h         ;,T)=)K-=':-WPIWP':,:   ,WW    +/, ..' :+,9)
  mov b[fs:di+bp],al ;Y):LX:.:=EHR,PU:'/''   (WW    I:=, .,-9CO)
  inc di             ;()-+,,HPT+C:W9= ,)'    /WT'   T.: --PCXCKF'
  add sp,6           ;7LIHTP+OY3LW'3:,L..    WW)    ,,(W('MX'WT'
  loop j              ;7T,I-:XF:WF(: ,)    ':WWT  ,=PT:T(AY) W
  fiadd w[7]          ;(PWW)W3=/P,P  ,     ,'WW),YP,WH,)Y)TWX9)
  fstp d[gs:bx]       ;3)OWRE)-YUY'... '  ..(WWXWW)9W+C)WUP9P3'
  dec cx             ;,WTHEF:LOP:W ' ,.   ,:(WPY(W,(P::)W(P3+)
  les si,[0]         ;(P3WF/:WM:() :.:      (WHY)39HC'U()(W,W)
  mov di,158dh       ;(LW9/CWY-,E'  ,'     'YPL/T:WP:,(()3Y W)
  fs rep movsb       ;(TLUEEP=7W+.,:)       -P-:,PWT.:Y()() W+
  jmp a              ;(EP/30-OAT .'3  . . . .C,P):WP Y)()3C:PW
l:dec bp             ;(PWMH:FXW'',-(, '   ',97WMU(7: )LW W .WW
  mov dx,331h        ;(WOWF-7EP)-X3., , ,,WP+WYY+YW' )WW 3 .W7)
  mov al,3fh          ;9W93UOY):.)/.- :YWCWU-EIMC)E (-WP + ,WW'
  out dx,al           ;(XWYUWY.,:'.,,YE3-7WE3WXV(UT,( W),T =P'
  dec dx              ;(PT709),)C:/FY9)T.(W9YHL/Y(C T,W)') W.
  mov al,99h          ;(+UTYH-:-=C-(P(-).WWF3:))3(U))(W)() P'
  out dx,al           ;3P7Y3)/'XP:)WP(J. WXCWKV:)()))(W'U)()
  mov ax,bp           ;7OLY3',H9),YW'F ),W)CT)/Y((-))'W,U)()
  aam 8               ;7F=T-/T(=)A3C,)3)(WA()=)TY(CY'YWY(::)
  jnz m               ;W9C=()L/3,9'/('Y,YWU(XE/))()E.YT)3:)L
  mov al,24h          ;W=P:F:(,)),,'F'/:WP+3OY':)(R+ /T,T')W
  out dx,al        ;-=WRHX9C9-W'=,),)'A,A)XW779EXWK+.()3W),(,
  out dx,al      ;,W=-'L,,XX)/)+'I 3)39I(UHE-+LX39TWH/LUP)(H)
m:iret          ;,P:. ,-90/,(F0'/:,W //'(YOC':--YY3/IRW'9LT')