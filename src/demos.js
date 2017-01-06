// HELLO WORLD
hello.onclick = e => {
  bytes = [149,186,7,1,205,33,195,72,101,108,108,111,32,87,111,114,108,100,33,36];
  td_original.innerHTML = `<pre>xchg bp,ax  ; already a trick, puts 09h into AH
mov dx,text ; DX expects the adress of a $ terminated string
int 21h     ; call the DOS function (AH = 09h)
ret         ; quit
text: db 'Hello World!$'`;
  cpu_mode = 32;
  disassemble();
}

// XOR
xor.onclick = e => {
  bytes = [176,19,205,16,104,0,160,7,153,137,248,187,64,1,247,243,49,208,36,40,170,235,241];
  td_original.innerHTML = `<pre>mov al,0x13
int 0x10
push 0xa000
pop es
X: cwd       ; "clear" DX (if AH < 0x7F)
mov ax,di    ; get screen position into AX
mov bx,320   ; get screen width into BX
div bx       ; divide, to get row and column
xor ax,dx    ; the famous XOR pattern
and al,32+8  ; a more interesting variation of it
stosb        ; finally, draw to the screen
jmp short X  ; rinse and repeat`;
  cpu_mode = 32;
  disassemble();
}

// XOR ANIM
xoranim.onclick = e => {
  bytes = [153,176,19,205,16,137,200,1,248,48,224,36,40,180,12,226,242,71,228,96,254,200,117,235,195];
  td_original.innerHTML = `<pre>cwd           ; "clear" DX for perfect alignment
mov  al,0x13
X:   int 0x10 ; set video mode AND draw pixel
mov  ax,cx    ; get column in AH
add  ax,di    ; offset by framecounter
xor  al,ah    ; the famous XOR pattern
and  al,32+8  ; a more interesting variation of it
mov  ah,0x0C  ; set subfunction "set pixel" for int 0x10
loop X        ; loop 65536 times
inc  di       ; increment framecounter
in   al,0x60  ; check keyboard ...
dec  al       ; ... for ESC
jnz  X        ; rinse and repeat
ret           ; quit program`;
  cpu_mode = 32;
  disassemble();
}

// TUNNEL
tunnel.onclick = e => {
  bytes = [104,186,159,12,19,7,205,16,42,52,96,223,71,247,223,71,248,217,243,221,209,217,255,218,12,222,119,248,222,2,219,95,249,222,76,61,223,95,251,97,48,200,36,26,170,184,205,204,247,231,112,212,131,2,23,228,96,72,117,204,195,119,25];
  td_original.innerHTML = `<pre>push 0xa000 - 10 - 3 * 20 ; video base - 3.5 lines
or al, 0x13               ; mode 13h = 320 x 200 in 256 colors
pop es                    ; get aligned video memory base
int 0x10                  ; switch videomode
X: sub dh, [si]           ; vertical alignment
pusha                     ; push all registers on stack
fild word  [bx-9]         ; fpustack :  x
fild word  [bx-8]         ; fpustack :  y  x
fpatan                    ; fpustack : arc
fst st1                   ; fpustack :  arc  arc
fcos                      ; fpustack :  cos(arc)  arc
fimul dword  [si]         ; fpustack :  l*cos(arc)  arc
fidiv word  [bx-8]        ; fpustack :  l*cos(arc)/x  arc
fiadd word  [bp+si]       ; fpustack :  l*cos(arc)/x+offset  arc
fistp dword  [bx-7]       ; fpustack :  arc
fimul word  [byte si+val] ; fpustack :  scaled_arc
fistp word  [bx-5]        ; fpustack :  -
popa                      ; pop all registers from stack
xor al, cl                ; XOR scaled_arc with distance
and al, 16 + 8 + 2        ; sub selecting palette part
stosb                     ; writing to screen
mov ax, 0xCCCD            ; Performing the famous
mul di                    ; Rrrola trick
jo X                      ; next frame check
add word [bp+si], byte 23 ; change offset smoothly
in al, 0x60               ; check for ...
dec ax                    ; ...ESC key
jnz X                     ; otherwise continue
ret                       ; quit program
val: dw 6519              ; n = 160 * 256 / pi / 2 ; 0x1977`;
  cpu_mode = 32;
  disassemble();
}

// M8TRIX.COM
m8trix.onclick = e => {
  bytes = [196,28,159,171,71,71,235,249];
  td_original.innerHTML = `<pre>S: 
les bx,[si]		; sets ES to the screen, assume si = 0x100
				; 0x101 is SBB AL,9F and changes the char
				; without CR flag, there would be
				; no animation ;)
lahf			; gets 0x02 (green) in the first run
				; afterwards, it is not called again
				; because of alignment ;)
stosw			; print the green char ...
				; (is also 0xAB9F and works as segment)
inc di			; and skip one row
inc di			;
jmp short S+1   ; repeat on 0x101 `;
  cpu_mode = 32;
  disassemble();
}

// POINT16B.COM
point16b.onclick = e => {
  bytes = [176,18,67,205,16,147,52,2,205,51,147,180,12,226,244,195];
  td_original.innerHTML = `<pre>mov al,0x12	; assume ah = 0 ; set graphics mode to 640*480
inc bx		; assume bx = 0 ; set to 1 (show cursor)
mloop:	
int 0x10	; first loop, switch to graphic mode
		; further loops, set pixel		
xchg bx,ax	; first loop, set AX to 1 (show cursor)
		; further loops, restore old calling mode		
xor al,0x02	; switch modes : show cursor <-> get mouse state
		; updating XY every second loop plus drawing
		; one pixel left results in thicker lines		
int 0x33	; call the mouse interrupt
xchg bx,ax	; store the button state in AL for drawing
		; remember the current calling mode
		; for switching it later (in BX)			
mov ah,0x0C	; set mode to "set pixel"
loop mloop	; dec CX -> draw one pixel left from cursor
		; basically enables drawing pixels
		; while the cursor is active
		; allows exit if the mouse is leftmost
ret		; assume [[FFEE]] = [0] = CD20 = int 20`;
  cpu_mode = 32;
  disassemble();
}

// FIREWAVE
firewave.onclick = e => {
  bytes = [196,28,144,170,17,249,24,216,230,66,230,97,36,68,255,230];
  td_original.innerHTML = `<pre>les bx,[si]		;		les ... miserables ^^
nop				;		let's take a break and chill
stosb			;		write something to the screen
adc cx,di		;		things are adding up
sbb al,bl		;		let's not get carried away
out 42h,al		;		because 42 is *the* answer
out 61h,al		;		always good to have another out
and al,44h 		;		may the fours be with you
jmp si			;		the mack daddy makes ya!`;
  cpu_mode = 32;
  disassemble();
}

// DIROJED
dirojed.onclick = e => {
  bytes = [176,19,205,16,197,31,56,15,16,39,107,219,229,138,15,2,9,2,143,191,254,2,72,63,75,228,96,254,200,117,231,195];
  td_original.innerHTML = `<pre>S equ 0E5h        ; like original
; S equ 0B1h        ; vertical "scouts"

org 100h          ; assumes: ah=0 bx=0 cl>0 di=0FFFEh si=0100h

mov  al,13h       ; (2)
int  10h          ; (2)
lds  bx,[bx]      ; (2) bx=20CDh ds=9FFFh
M:
cmp  [bx],cl      ; (2)
adc  [bx],ah      ; (2) if ([bx] < cl) [bx]++ (first pass increases)
imul bx,byte S    ; (3) pseudorandom generator: bx = S*bx-1 (works if S%4==1)
mov  cl,[bx]      ; (2) we don't decrease bx yet
add  cl,[bx+di]   ; (2)
add  cl,[bx-321]  ; (4)
add  cl,[bx+si+63]; (3) cl = ([bx+1]+[bx-1]+[bx-320]+[bx+320]) & 0FFh
dec  bx           ; (1)

in   al,60h       ; (2) standard ESC check
dec  al           ; (2)
jnz  M            ; (2)
ret               ; (1)`;
  cpu_mode = 32;
  disassemble();
}
  
// DRAGON FADE
dragonfade.onclick = e => {
  bytes = [176,18,205,16,81,41,209,254,197,209,249,208,216,95,1,250,209,250,114,8,135,202,247,217,129,193,107,2,180,12,235,226];
  td_original.innerHTML = `<pre>mov al,0x12
S: int 0x10
push cx			
sub cx,dx		
inc ch
sar cx,1			
rcr al,1
pop di				
add dx,di 
sar dx,1
jc B
xchg cx,dx
neg cx
add cx,0x26b
B: mov ah,0x0C
jmp short S`;
  cpu_mode = 32;
  disassemble();
}
  
// FR01
fr01.onclick = e => {
  bytes = [176,19,245,66,205,16,104,0,160,7,247,227,64,1,248,17,28,247,116,12,216,12,222,4,223,31,45,130,0,135,7,49,193,223,7,216,200,49,235,146,217,201,117,232,222,193,217,250,216,60,223,7,223,70,0,217,243,214,145,12,135,170,235,202];
  td_original.innerHTML = `<pre>start		mov			al, 0x13
				cmc
				inc			dx
				int			0x10
				push		word 0xa000
				pop			es
				
pix			mul			bx
				inc			ax
				add			ax, di
				adc			[si], bx
				div		  word [si+12]

clp			fmul		dword [si]
				fiadd		word [si]
				fistp		word [bx]
				sub			ax, 130
				xchg		ax, [bx]
				xor			cx, ax
				fild		word [bx]
				fmul		st0
				xor			bx, bp
				xchg		ax, dx
				fxch		st1
				jnz			clp
	
				faddp		st1, st0
				fsqrt
				fdivr		dword [si]

				fild		word [bx]
				fild		word [bp]
				fpatan

				salc
				xchg		ax, cx
				or			al, 0x87
				stosb
				jmp			short pix`;
  cpu_mode = 16;
  disassemble();
}

  
// FUTURA
futura.onclick = e => {
  bytes = [176,19,205,16,142,39,186,234,1,184,28,37,205,33,129,229,255,0,117,12,46,128,54,234,1,8,129,54,58,1,145,74,190,64,1,177,255,137,203,246,211,153,141,69,240,247,246,45,200,0,15,175,195,5,3,63,41,234,144,144,15,175,211,129,194,3,143,1,235,136,240,128,252,30,114,2,0,227,32,222,0,198,246,195,240,117,3,128,236,39,8,230,128,230,64,225,196,254,196,48,216,37,3,63,246,228,212,5,116,6,15,164,200,12,4,16,100,136,5,71,117,166,49,201,187,40,0,101,217,7,153,137,200,247,243,82,153,247,243,80,82,137,230,223,4,223,68,2,223,68,4,217,195,217,251,216,202,217,201,216,203,222,193,217,196,217,251,222,204,222,202,217,201,222,234,217,202,245,114,227,223,28,131,4,80,105,60,64,1,223,28,3,60,223,28,172,100,2,1,192,232,4,52,24,100,136,3,71,131,196,6,226,173,222,6,7,0,101,217,31,73,196,54,0,0,191,141,21,100,243,164,233,36,255,77,186,49,3,176,63,238,74,176,153,238,137,232,212,8,117,4,176,36,238,238,207];
  td_original.innerHTML = `<pre>b equ byte                  ;,: 
w equ word                ;,?}'
d equ dword             ;=!J |
  org 100h            ;,*-. ?&
  mov al,13h          ;WP) Y9P
  int 10h            ;YP   ,W'
  mov fs,w[bx]      ;,W)  ,WW.'
  mov dx,l          ;WW) ,WWW)
  mov ax,251ch      ;7W),WWWW'
  int 21h           ;'WWWWWW'
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
m:iret          ;,P:. ,-90/,(F0'/:,W //'(YOC':--YY3/IRW'9LT')`;
  cpu_mode = 32;
  disassemble();
}
  
  
// MEGAPOLE
megapole.onclick = e => {
  bytes = [142,224,93,176,19,205,16,104,0,160,7,247,197,0,1,116,5,128,54,22,1,8,77,185,255,0,153,190,64,1,137,203,137,248,246,211,247,246,232,151,0,232,148,0,190,108,4,100,2,28,18,52,2,100,1,136,240,16,197,32,222,183,48,178,32,232,134,0,116,33,83,178,16,183,20,100,42,28,100,42,28,48,237,232,116,0,91,116,14,178,24,183,28,100,2,28,232,103,0,116,2,226,179,146,128,254,64,116,42,156,88,158,122,33,132,201,116,4,254,198,117,4,176,255,235,29,32,216,48,240,48,218,32,242,192,224,2,128,226,1,15,69,193,180,255,40,196,136,224,235,4,246,212,32,224,252,212,18,176,16,213,1,133,255,122,1,64,170,15,133,107,255,199,4,17,55,100,199,68,228,1,23,180,9,186,247,1,205,33,233,75,255,146,41,232,15,175,195,5,127,6,195,80,246,195,64,117,27,56,252,115,23,56,212,114,19,246,195,120,117,12,132,237,117,5,168,120,117,4,253,128,196,24,48,236,246,198,16,117,2,0,198,8,244,158,88,195,109,101,103,97,112,111,108,101,36];
  td_original.innerHTML = `<pre>b equ byte                 ; tested on xp, freedos, ms windows dos and its debug
w equ word                 ; short form pretty-print helpers datatype specifiers
  org 100h                 ; entering ip=cs:256 just above .com psp 127-byte dta
  mov fs,ax                ; ax=0? was pop bp before rewrite for non-zero fs seg  
  pop bp                   ; bp=0 cs:[0fffeh]=ss:[sp]=0000 if not debug executed
  mov al,13h               ; function switch to video mode 13h 320x200x256 & cls
  int 10h                  ; general video bios service for all mode 13h vga api
  push w 0a000h            ; was les cx,[bx] es=9fffh cx=20cdh & lea ax,[di-10h]
  pop es                   ; ms-dos v6.22 or freedos not "les rr,[0]" compatible
a:test bp,100h             ; script idx bounds reached? bp E [0;255] i.e aam 255
  jz c                     ; if hibyte OR rollover sign propagated to hibyte lsb
  xor b[c],8h              ; xor mutex modify next opcode to keep idx normalized
c:dec bp                   ; follow through and advance script idx dec bp/inc bp
e:mov cx,0ffh              ; cl=visibility fostrum, null ch implicit object mask
g:cwd                      ; shorter xor dx,dx with ah<128 for div moved for agi
  mov si,140h              ; vga vid mode 19 horizontal scanline width in pixels
  mov bx,cx                ; bl=distance nullify bh raymarch object height limit
  mov ax,di                ; di=beam spot absolute vga coord, no dos para fix-up
  not bl                   ; bl=distance/z axis orientation= -visibility fostrum
  div si                   ; main 3d projection returns with ax=y dx=x  ; dh = x
  call q                   ; main 3d projection returns withah=(y-y0)*z ; bl = z
  call q                   ; main 3d projection returns withah=(x-x0)*z ; ah = y
  mov si,46ch              ; 46ch=bda rtc off in zero seg plus ad hoc off buffer
  add bl,[fs:si]           ; bl=z+=rtc word in bda advances camera, assumed fs=0
  adc dh,[si]              ; dh+=beam spot camera x coordinates cs/ds:46ch & rtc
  add ah,[si+1]            ; ah+=beam spot camera y coordinates cs/ds:46dh & rtc
  mov al,dh                ; push/pop preserve texture x>>8 texel base for later   
  adc ch,al                ; this object's implicit form xor /w building overlay
  and dh,bl                ; dh=x bl=x i.e x+=y bh and dl used as generic params
  mov bh,30h               ; bh=y height max of overpass, function generic param
  mov dl,20h               ; dl=y height min of overpass, function generic param
  call r                   ; function returns if this object or building ray hit
  jz h                     ; if objects volume intersect with ray texture former
  push bx                  ; preserve prev rtc time to avoid costly seg override
  mov dl,10h               ; dl=y height max of spaceship function generic param
  mov bh,14h               ; bh=y height min of spaceship function generic param
  sub bl,[fs:si]           ; bl=z+=rtc word in bda advances spaceship1 camera<--
  sub bl,[fs:si]           ; bl=z+=rtc word in bda advances spaceship1 camera<--
  xor ch,ch                ; flag differenciates between spaceship* and overpass
  call r                   ; function returns if this object or building ray hit
  pop bx                   ; restore prev rtc time also implicit ch val returned
  jz h                     ; if objects volume intersect with ray texture former
  mov dl,18h               ; dl=y height max of spaceship function generic param
  mov bh,1ch               ; bh=y height min of spaceship function generic param
  add bl,[fs:si]           ; bl=z+=rtc word in bda advances spaceship2 camera-->
  call r                   ; function returns if this object or building ray hit
  jz h                     ; if objects volume intersect with ray texture former
  loop g                   ; if no object volumes intersect then continue z rays
h:xchg ax,dx               ; texture subroutine - clone ray collision height val
  cmp dh,40h               ; test if this ray collision height val is exactly 64
  jz l                     ; process as scenery bottom floor, al=depth was saved
  pushf                    ; ax disposed of in z-buffer order override data flow
  pop ax                   ; subroutine marked eflags /w bit10 df=spaceship true
  sahf                     ; convert this object's bit10 df to pf for conditions
  jp k                     ; if z-ray collided with a spaceship object then exit
  test cl,cl               ; else test if ray collision exited on loop condition
  jz i                     ; if distance=0=>no scenery intersection=open horizon
  inc dh                   ; test if this ray collision height=top=255=sky limit
  jnz j                    ; else ray hit other scenery building/overpass object
i:mov al,0ffh              ; is sky so apply old b/w film rear projection effect
  jmp m                    ; with brightest standard vga palette grayscale color
j:and al,bl                ; is building/overpass process texel window step #1/3
  xor al,dh                ; is building/overpass process texel window step #2/3
  xor dl,bl                ; is building/overpass process texel bricks step #1/2
  and dl,dh                ; is building/overpass process texel bricks step #2/2
  shl al,02h               ; is building/overpass process texel window step #3/3
  and dl,01h               ; test for building/overpass window or bricks texture
  cmovnz ax,cx             ; if window texel then color val=distance 586+ opcode
  mov ah,0ffh              ; colour for window or bricks of building or overpass
  sub ah,al                ; is dynamic for windows and static for all other obj
k:mov al,ah                ; thunk for building/overpass/window/bricks/spaceship
  jmp m                    ; proceed to last step of grayscale color normalizing
l:not ah                   ; floor grey bicolor flat-shaded for building shadows
  and al,ah                ; floor color multiplexes shadow depth=k*(255-height)
m:cld                      ; common thunk nullifies next spaceship=true obj flag
  aam 12h                  ; normalize with dithering add overlap ah=color/18+00
  mov al,16                ; normalize with dithering add overlap ah=color/18+16 
  aad 1                    ; dithering normalized and prepare for next frame cwd
  test di,di               ; test for all pixels plotted overrunning vga segment
  jp o                     ; preserve zf flag and test if absolute beam position
  inc ax                   ; parity even augmenting lighting for odd meta-pixels
o:stosb                    ; write screen pixel & advance absolute beam position
  jnz e                    ; if dst idx then continue automatic vga wrap-up fill
  mov w[si],3711h          ; post-assigns camera fixed value coordinates (17,55)
  mov w[fs:si-1ch],1701h   ; bda mem vid page 0 title curs position col=1 row=24
  mov ah,9                 ; dos 1+ write $ terminated string to standard output
  mov dx,p                 ; hardcoded 24h terminated ascii string of demo title
  int 21h                  ; general ms-dos api /w function 9 print ds:dx string
  jmp a                    ; process next demo frame (sorry no escape sequence!)
q:xchg ax,dx               ; 3-axis rotations require 2-axis ah=dh=x dh=(y-y0)*z
  sub ax,bp                ; translate to demo script idx arbitrary origin bp,bp
  imul ax,bx               ; project abcsisses/ordinates ah=(x-x0)*z dh=(y-y0)*z
  add ax,67fh              ; translate back to ~center=k*sqr(2) arbitrary fix-up
  ret                      ; --------------------------->return to caller (0c3h)
r:push ax                  ; isosurface discrimination preserve building overlay
  test bl,40h              ; is it time~depth (i.e z+rtc) displaying an overpass
  jnz v                    ; if not then process default buildings intersections
  cmp ah,bh                ; is y height>min of spaceship/overpass generic param
  jnc v                    ; if not then process default buildings intersections
  cmp ah,dl                ; is y height<max of spaceship/overpass generic param
  jc v                     ; if not then process default buildings intersections
  test bl,78h              ; is spaceship/overpass 120<z depth<128 static params
  jnz u                    ; if not then process modified building intersections
  test ch,ch               ; flag differenciates between spaceship* and overpass
  jnz t                    ; if overpass then proceed to translate it vertically
  test al,78h              ; is spaceship only objects 120<x width<128 in static
  jnz u                    ; if not then process modified building intersections
  std                      ; is spaceship and visible so set df flag accordingly
t:add ah,18h               ; translate spaceship/overpass objects vertically +24
u:xor ah,ch                ; this object's implicit form xor /w building overlay
v:test dh,10h              ; alternate scene vertical irregularity every step 16
  jnz x                    ; i.e : _||_||_||_||_||_||_||_||_||_||_||_||_||_||_||
  add dh,al                ; reduce scene horizontally = strech scene vertically
x:or ah,dh                 ; induce scene horizontal "y-colinear" irregularities
  sahf                     ; implicit isosurface volume x AND y AND z AND 64=64?
  pop ax                   ; isosurface discrimination preserve building overlay
  ret                      ; --------------------------->return to caller (0c3h)
p db "megapole$"           ; hardcoded 24h terminated ascii string of demo title`;
  cpu_mode = 32;
  disassemble();
}
  
// PULS
puls.onclick = e => {
  bytes = [176,19,83,186,200,3,205,16,136,216,132,203,122,5,246,232,193,232,7,246,235,136,224,238,178,201,226,236,177,3,75,117,233,104,206,159,7,183,86,219,227,131,0,88,223,0,217,251,220,249,223,0,216,12,217,254,222,12,102,90,6,85,96,137,31,139,5,223,5,247,232,41,23,79,123,245,223,7,102,129,5,205,204,0,0,216,204,217,192,216,206,217,202,216,205,220,234,216,206,222,193,217,202,71,123,235,79,107,16,10,223,25,137,23,2,52,0,251,115,246,153,180,230,17,217,232,21,0,40,204,213,4,4,70,137,69,252,97,69,38,136,2,117,174,228,96,72,117,146,179,0,139,41,211,253,49,213,1,47,0,251,115,244,214,223,16,81,211,233,128,197,37,139,16,247,24,105,232,0,128,43,41,121,2,247,221,209,237,1,234,137,47,0,251,115,236,57,202,64,114,37,179,2,122,223,43,16,64,43,16,128,238,96,107,210,13,139,20,112,2,64,153,43,47,121,2,247,221,1,234,139,47,0,251,115,242,57,202,89,25,210,245,24,209,16,209,128,249,6,115,4,0,212,117,150,195];
  td_original.innerHTML = `<pre>  mov  al,13h   ;<(byte)[100h]>>8 = 0.6875
  push bx       ; (word)[100h]>>16 = 0.0769
  mov  dx,3C8h  ; (float)[100h] = -0.0008052
  int  10h

;palette - 4 gradients of 32 shades

P mov  al,bl    ;<set al on 1st pass, then each red and green
Q test bl,cl    ; parity: eooooeoeoeee eooooeoeoeee ...
  jpe  E        ; index:  #0gb1gb2gb3g b4gb5gb6gb7g ...
  imul al
  shr  ax,7
E imul bl
  mov  al,ah
  out  dx,al
  mov  dl,0c9h
  loop P
  mov  cl,3
  dec  bx
  jnz  Q

  push 09FCEh   ;<aligns with the screen ;-)
  pop  es
  mov  bh,56h   ; xyz addressing trick from neon_station
                ; vecNN = (words){[5600h+N] [5656h+N] [56ACh+N]}

;frame loop - prepare constants
;ax=key bx=5600h bp=dx=0 cx=3 si=100h di=-2 sp=-4 word[5700h]=T

M fninit                ; {} = fpu stack
  add  word[bx+si],byte 88 ; T++

  fild   word[bx+si]    ;=14.00564 * 2pi
  fsincos               ; {s=sin(T*0.00564) c=cos(T*0.00564)}
  fdiv   st1,st0        ; {s t=cotg(T*0.00564)}

  fild   word[bx+si]
  fmul   dword[si]
  fsin
  fimul  word[si]       ; {r>>16=0.0769*sin(T*-0.0708) s t}

  pop  edx      ;=9B6C0000... just get rid of it
  push es
  push bp       ;dword[-4]=9FCE0000h

;pixel loop
;x = word[-3] ~ -0.5..0.5 (+= 0.003125 each column)
;y = word[-2] ~ -0.4..0.4 (+= 0.00390625 each row)

X
 %ifdef BLOCKS
  test bp,cx    ; 4x1 blocks: keep last color?
  jnz  D
 %endif

  pusha ;[-20 -18 -16 -14 -12 -10 -8  -6  -4  -2  ]
        ; di  si  bp  sp  bx  dx  cx  ax      yyyy
        ; FEFF0001adr FCFF005600000300col ..xxxx

;fisheye projection: z = C-x*x-y*y

  mov  [bx],bx ;=0.33594
Z mov  ax,[di]
  fild   word[di]
  imul ax
  sub  [bx],dx
  dec  di
  jpo  Z        ;di=-4
  fild   word[bx]       ; {z>>16=0.33594-x*x-y*y x y r s t}

;advance x and y for next pixel (low word)

 %ifdef BLOCKS
  add  word[di],3334h
 %else
  add  dword[di],0000CCCDh
 %endif

;rotate direction vector

R fmul   st4    ; {sz x y r s t}
  fld    st0
  fmul   st6    ; {cz sz x y r s t}
  fxch   st2
  fmul   st5
  fsub   st2,st0; {sx sz cz-sx y r s t}
  fmul   st6
  faddp  st1,st0; {cx+sz cz-sx y r s t}
  fxch   st2    ; {y cz-sx cx+sz r s t}
  inc  di
  jpo  R
  dec  di       ;di=-2  ; {X Y Z r s t}

;advance x and y for next pixel (high word)

 %ifdef BLOCKS
  adc  word[di],cx
 %endif

;store ray origin and direction vector

  imul dx,[bx+si],byte 10;=0.0134*T
S
  fistp  word[bx+di]    ; d>>16 = v-2 = {X, Y, Z}
 ;fistp dword[bx+di]    ;<slower, but fixes corners (+3 bytes)
 ;sar dword[bx+di],1

  mov  [bx],dx
  add  dh,[si]          ; o>>16 = v0 = 0.0134*T + {0, 0.6875, 0.375}
  add  bl,bh
  jnc  S        ;bl=2   ; {r s t}

;intersect ray with scene, count number of bounding volume misses

  cwd                   ; dx = hit(-1|0): grainy rendering
  mov  ah,-MAXITERS     ; ah = iters(-MAXITERS..0), al = hue(0..3)
 ;cwd                   ;<for smooth rendering with bands

 %ifdef BLOWUP
  mov  cx,BLOWUP*256+MAXSTEPSHIFT; cl = stepshift(0..MAXSTEPSHIFT)
 %else
  adc  cx,bx    ;=86*256 + 6 ;-)
 %endif

  call I

  sub  ah,cl
  aad  4        ;ah=0
  add  al,MAXITERS*4+BASECOLOR
  mov  [di-4],ax        ; pushed ax = color = (iters-stepshift)*4 + hue

  popa

;draw pixel

D
 %ifdef BLOCKS
  mov  [es:bp+si],al
  inc  bp
 %else
  inc  bp
  mov  [es:bp+si],al
 %endif

  jnz  X                ; 65536 pixels

;next frame: fall through on esc - ah=word[sp]=0

  in   al,60h
  dec  ax
  jnz  M        ;<assume no one presses ESC after 1 frame ;)


;raycasting using unbounded binary search
;start with the smallest step size
;v-2 = d = {dx, dy, dz}
;v0  = o = current {x, y, z} mod 1

;last probe was inside: halve step and go back
;              outside: double step and go forward

I mov  bl,0     ;bl=0
A mov  bp,[bx+di]       ; hit ? (o -= d>>stepshift) : (o += d>>stepshift)
  sar  bp,cl
  xor  bp,dx
  add  [bx],bp
  add  bl,bh
  jnc  A        ;bl=2

  salc          ;al=FFh
  fist   word[bx+si]    ; word[5702h] = r

;bounding volumes: "blow up" the scene by the current step size

  push cx
  shr  cx,cl
  add  ch,37    ; cx = hitlimit = 0.1445 + (BLOWUP >> stepshift+8)

;inside test

;hue=[0,1]
;green octahedra:              (|x|+|y|+|z|)/2 - 0.1445 + r < blowup
;orange octahedra: (|x+0.5|+|y+0.5|+|z+0.5|)/2 - 0.1445 - r < blowup

O mov  dx,[bx+si]       ; dx = [r,-r]
  neg  word[bx+si]
C imul bp,ax,32768      ; bp = [0.5, 0] - v0.xyz
  sub  bp,[bx+di]
  jns  T
  neg  bp
T shr  bp,1
  add  dx,bp            ; v2 = |signed(bp)|/2
  mov  [bx],bp
  add  bl,bh
  jnc  C        ;bl=4   ; dx = sum(v2) + [r,-r]

  cmp  dx,cx            ; if (dx < hitlimit) hit!
  inc  ax       ;al=0,ah++
  jc   H
  mov  bl,2     ;bl=2
  jpe  O        ;al=1   ; repeat if al==0

;hue=[2,3]
;bars:  (||x|-|z|| + ||y|-|x|| + ||z|-|y||)/2 - 0.0676 < blowup
;bolts: (||x|-|z|| + ||y|-|x|| + ||z|-|y||)/2 - 0.1445 < blowup

  sub  dx,[bx+si]
  inc  ax       ;al=2

 ;sub  dx,bx            ;<simple bolt movement: sum(v2)-2*r-0.3359
  sub  dx,[bx+si]       ;<precise bolt movement: sum(v2)-3*r-0.375
  sub  dh,60h           ; (+3 bytes)

  imul dx,byte 13       ; if (|sum(v2)-3*r-0.375| < 0.03846)
  mov  dx,[si]          ;   dx = extra_width = 0.0769, hue = 2
  jo   B                ; else
  inc  ax       ;al=3   ;   dx = extra_width = 0, hue = 3
  cwd
B sub  bp,[bx]          ; bp = v2.zxy - v2.xyz
  jns  L
  neg  bp
L add  dx,bp
  mov  bp,[bx]
  add  bl,bh
  jnc  B        ;bl=4   ; dx = sum(|signed(bp)|) + extra_width

  cmp  dx,cx            ; if (dx < hitlimit) hit!

;adjust step size according to the hit result

H pop  cx       ;cf=hit
  sbb  dx,dx            ; dx = hit?-1:0
  cmc
  sbb  cl,dl            ; if (hit) stepshift++
  adc  cl,dl            ; else if (stepshift > 0) stepshift--

;more probes?

  cmp  cl,MAXSTEPSHIFT
  jae  F                ; if (stepshift >= maxstepshift) break
  add  ah,dl            ; iters++, if (hit) iters--
  jne  I                ; if (iters >= maxiters) break
F ret`;
  cpu_mode = 32;
  disassemble();
}

// 4IS256.COM
tetris.onclick = e => {
  bytes = [64,205,16,180,5,205,16,104,0,184,7,6,31,191,178,15,137,254,185,28,0,131,239,80,128,195,64,131,238,100,184,186,8,171,131,239,24,171,186,10,0,8,165,193,8,34,68,1,165,74,117,245,36,8,117,224,226,219,57,254,116,4,128,235,32,76,228,64,180,90,247,231,137,213,138,78,136,191,133,7,140,198,8,219,116,20,87,191,178,15,75,79,79,176,48,134,5,12,16,60,57,116,244,64,170,95,186,218,3,236,36,8,116,248,236,36,8,117,251,232,95,0,15,131,130,254,180,2,205,22,32,199,134,199,246,215,96,208,232,115,1,175,208,232,115,2,79,79,193,224,15,115,11,67,183,8,137,230,131,198,16,131,199,80,121,18,193,209,13,209,216,115,249,58,102,136,116,3,193,200,12,134,224,145,232,30,0,115,4,131,196,16,96,97,141,70,0,209,198,115,11,104,82,1,113,11,88,49,192,96,235,200,12,8,104,13,1,83,49,219,209,201,115,11,246,1,8,117,18,136,1,198,65,255,219,67,67,246,195,8,116,234,128,195,72,115,229,91,195,240,99,116,113,54,114,51];
  td_original.innerHTML = `<pre>inc  ax
int  10h
mov  ah,5  ; textmode 40x25, page 1 (offset 800h)
int  10h   ; filled with gray spaces on black (0720h)
push word 0B800h
pop  es
push es
pop  ds


; Draw the pit and erase complete rows

P:
mov  di,2178+(HEIGHT-1)*80
mov  si,di ;-) si = source row, di = destination row
mov  cx,HEIGHT+4
E:
sub  di,byte 80
N:
add  bl,64 ; score += {0,64,128,192}[erased rows mod 4]
sub  si,byte 80+WIDTH*2

mov  ax,800h+PIT_CHAR
stosw
sub  di,byte WIDTH*2+4
stosw

mov  dx,WIDTH
A:
or   [di+(HEIGHT+4)*80+1],ah
and  al,[si+1]
movsw      ; white score at the bottom of the pit, shift rows
dec  dx
jnz  A

and  al,8  ; brightness all the way?
jnz  N
loop E

cmp  si,di ; if any rows were deleted, adjust score to +32/96/160/224
je   G
sub  bl,32
dec  sp    ; sp = 0FFFEh-total deletions


; Generate a new brick

G:         ; di=6F2h cx=0
in   al,40h; could be "rdtsc" for hardcore randomness
mov  ah,5Ah
mul  di    ; dx:ax=2711400h..277FF0Eh
mov  bp,dx
mov  cl,[byte bp-271h+S]
mov  di,800h-160+48-(WIDTH|1)
mov  si,es ;-) the highest bits of si need to be "10"

; bp = brick index + 271h
; cx = rotated brick layout (4 bits per row)
; di = brick position
; most significant zero bit in sp = number of frames before dropping
; (si is used for checking that)


; Increase the displayed score by 1

M:
or   bl,bl
jz   V
push di    ; di = behind the last zero
mov  di,800h+HEIGHT*80+50
dec  bx
D:
dec  di    ; next digit
dec  di
mov  al,'0'; assume overflow
xchg al,[di]
or   al,10h
cmp  al,'9'
je   D
inc  ax
stosb      ; if the digit wasn't '9', raise it
pop  di


; Wait for vertical retrace start (70/sec) and erase the brick

V:
mov  dx,3DAh
in   al,dx
and  al,8
jz   V
W:
in   al,dx
and  al,8
jnz  W     ; al=0
call B     ; if not erasable (= has no space to appear), GAME OVER
jnc  near 0


; Keyboard handler

mov  ah,2
int  16h
and  bh,al ; bh = previous shift state
xchg al,bh
not  bh    ; if a shift was just pressed, set a bit in al

pusha

shr  al,1  ; RSHIFT: X++
jnc  X
scasw      ; di+=2
X:

shr  al,1  ; LSHIFT: X--
jnc  Y
dec  di
dec  di
Y:

shl  ax,15

jnc  F     ; ALT: Y++, score++
inc  bx
mov  bh,8  ; can be held until landing
H:
mov  si,sp
add  si,byte 16
add  di,byte 80
F:

jns  C     ; CTRL: rotation
R:         ; ax=8000h, CF=0
rcl  cx,13 ; ax = cx rotated 90 degress ccw around [1;1]
rcr  ax,1
jnc  R
cmp  ah,[byte bp-271h+S]
je   I     ; if we reach the original shape, reload (for O,S,Z)
ror  ax,12
I:
xchg ah,al
xchg ax,cx
C:         ; al=0


; Test whether changes were OK, drop if it's time

call B
jnc  Q
add  sp,byte 16
pusha
Q:
popa       ; use [bp-7*16] for black background instead of gray
lea  ax,[bp+0]
rol  si,1  ; OF = (CF!=sign(si))
jnc  L     ; you can't land with alt only (less mistakes)

push word M
jno  B     ; doesn't have to fall: draw the brick

pop  ax    ; has to fall: clean the stack
xor  ax,ax
pusha
jmp  short H

L:
or   al,8  ; draw the fallen brick bright and generate next brick
push word P


; Brick drawing (al=color cx=shape di=address)

B:
push bx
xor  bx,bx
T:
ror  cx,1
jnc  skip  ; brightness prevents drawing
test byte[bx+di],8 ; CF=0
jnz  O
mov  [bx+di],al
mov  byte[bx+di-1],BRICK_CHAR
skip:
inc  bx
inc  bx    ; bl:00 02 04 06  08
test bl,8  ;    50 52 54 56  58
jz   T     ;    A0 A2 A4 A6  A8
add  bl,72 ;    F0 F2 F4 F6  F8 40+CF
jnc  T
O:
pop  bx    ; if the brick could be drawn, CF=1
ret

    ; .... ##.. ..#. #... .##. .#.. ##..
    ; #### .##. ###. ###. ##.. ###. ##..
S: db 0F0h, 63h, 74h, 71h, 36h, 72h, 33h`;
  cpu_mode = 32;
  disassemble();
}

// QUATRO.COM
quatro.onclick = e => {
  bytes = [104,0,160,7,49,237,176,19,182,128,142,218,65,205,16,128,237,2,128,238,4,75,184,16,16,226,242,49,210,185,64,1,137,248,247,241,107,243,3,1,216,131,250,28,116,40,131,250,4,126,35,131,250,25,116,30,129,250,61,1,115,24,131,250,34,124,6,129,250,30,1,126,17,1,240,128,194,8,32,208,208,232,36,8,116,75,176,62,235,71,168,120,117,3,214,235,64,15,172,198,23,48,228,131,232,100,131,234,127,131,230,3,96,219,227,223,70,246,222,118,3,217,254,222,78,3,223,70,252,223,70,248,138,138,203,1,255,209,223,94,252,97,138,138,207,1,255,209,168,16,117,2,52,31,212,16,193,230,4,1,240,136,5,71,15,133,115,255,67,186,218,3,236,36,8,116,251,137,254,165,133,255,117,251,228,96,254,200,15,133,91,255,48,208,1,216,41,248,209,232,195,154,255,211,228,229,240,200,243,200,192,216,194,216,200,217,201,216,200,222,193,217,250,222,126,0,222,193,195,216,193,217,243,222,142,201,1,222,193,195,217,201,195,87,193,231,2,246,37,95,136,224,195,78,79,80];
  td_original.innerHTML = `<pre>
start:			push 0xA000				; Push start of VGA video memory
			pop es					; into ES
			xor bp,bp				; BP adressing, uses SS, frees DS, no extra segment needed
			mov al,0x13				; mode 13h, 320x200 in 256 colors
			mov dh,0x80				; high byte of offscreen memory, low byte not important
			mov ds,dx				; no palette influence (later) when DH = 0x80
			inc cx					; align color components / color number / color count
palette_loop:		int 0x10				; shared int 10h ! (palette entry , set mode)
			sub ch,2				; adjust green value
			sub dh,4				; adjust red value
			dec bx					; next color
			mov ax,0x1010				; sub function to change palette
			loop palette_loop			; adjust blue value & loop
main_loop:		xor dx,dx				; create X Y from screen pointer
			mov cx,320				; also implicit  "MOV CH,1"
			mov ax,di				; get screenpointer
			div cx					; X Y in AX DX
			imul si,bx,byte 3		; border offset from timer
			add ax,bx				; effect offset from timer
			cmp dx,byte 28			; a lonely line ...
			je line
			cmp dx,byte 4			; make left border
			jle line
			cmp dx,byte 25			; another lonely line ... now friends =)
			je line
			cmp dx,317				; make right border
			jae line
			cmp dx,byte 33+1		; left outside
			jl outside
			cmp dx,287-1			; right outside
			jle further				; we're in the effect area, go further
outside:		add ax,si				; add our border offset (see above)
			add dl,8				; Offset to force "and" symmetry
			and al,dl				; "and" pattern (boxes)
			shr al,1				; this and next can be optimized to "and al,16"
			and al,8				; black on outside strip...
			jz short skip			; ...means plot black pixel (skip)
line:			mov al,62				; white on strip holes ;not clean white
			jmp short skip			; because only whitey ford sings the blues
further:		test al,64+32+16+8		; check if between effect windows
			jnz next				; if not : skip the skip ;)
			salc					; go black
			jmp short skip			; and plot black pixel
next:			shrd si,ax,23			; set value for fpu program decision
			xor ah,ah				; delete high byte from time influence (important!)
			sub ax,byte 100			; center around middle
			sub dx,byte 127;160 	; or, don't, because symmetry is boring ;)
			and si,byte 3			; bring down program number to 0-3
			pusha						; t <- BX, x <- AX , y <- DX
			fninit
			fild word [bp-10] 		; t		make big slow sine of t
			fidiv word [bp+3]		; t'	use value from PSP (~0x009F)
			fsin					; t''
			fimul word [bp+3]		; t'''  use value from PSP (~0x009F)
			fild word [bp-4]		; x t
			fild word [bp-8]		; y x t

			mov cl,[bp+si+offsetlist_fpu_parts]
			call cx					; call FPU part routine

			fistp word [bp-4]		; result -> AX
		popa

			mov cl,[bp+si+offsetlist_aftereffect]
			call cx					; call after effect routine
			
			test al,16				; wrap colors
			jnz skipwrap			; each 16 entries
			xor al,31				; to produce smooth
skipwrap:		aam 16					; color gradients

			shl si,4				; offset into color palette
			add ax,si				; according to effect number
skip:			mov [di],al				; plot value into offscreen
			inc di					; next pixel
			jnz main_loop			; repeat until all pixels done

			inc bx					; increment animation variable
			mov dx,0x3DA			; port number for checking retrace
vsync:			in al, dx				; wait
			and al, 8				; for
			jz vsync				; retrace

			mov si,di				; align offscreen and video memory
copy_pixels:		movsw					; double two pixels at once
			test di,di				; check if done
			jnz copy_pixels			; repeat until done

			in al,0x60				; read keyboard
			dec al					; check for 
			jnz main_loop			; ESCape, repeat if not
ae_part4:			xor al,dl				; the famous XOR pattern
			add ax,bx				; offset by time
			sub ax,di				; blurred by screenpointer
			shr ax,1				; and slowed down
ae_part1:
ae_part3:
			ret						; shared RET for all FX and program exit
val1:
			dw -102					; Value to scale [-pi,pi] to color palette
offsetlist_fpu_parts:				; byte offsets for FPU parts
			db fpu_part1-start,fpu_part2-start,fpu_part3-start,fpu_part4-start
offsetlist_aftereffect:				; byte offsets for after effects
			db ae_part1-start,ae_part2-start,ae_part3-start,ae_part4-start
fpu_part1:							; x y t
			fadd st0,st2			; xo y t
			fmul st0				; xo² y t
			fxch st0,st1			; y xo² t
			fmul st0				; y² xo² t
			faddp					; R² t
			fsqrt					; R t
			fidivr word [bp]		; R'
			faddp					; R + t
fpu_part2:							; x y t
			ret
fpu_part3:							; x y t
			fadd st0,st1
			fpatan					; a t
			fimul word [bp+val1]	; a' t
			faddp					; a'+t
			ret
fpu_part4:  						; x y t
			fxch st0,st1			; y x 
			ret
ae_part2:
			push di					; save screen pointer
			shl di,2				; apply the...
			mul byte[di]			; ...inceptional...
			pop di					; restore screen pointer
			mov al,ah				; ...sensenstyle
			ret						; and return
troll_section:
			db 'NOP'				; that was exhausting, now chill! =)`;
  cpu_mode = 32;
  disassemble();
}

// ATRAKTOR
atraktor.onclick = e => {
  bytes = [63,128,192,19,205,16,0,198,142,226,0,198,142,234,0,198,142,194,189,255,1,186,200,3,214,238,66,13,195,195,80,238,0,224,208,232,238,0,224,192,232,2,238,88,64,117,236,219,227,217,238,217,238,217,238,77,91,87,232,123,0,6,49,192,101,134,5,100,134,37,192,236,4,36,240,104,0,160,0,224,7,170,226,234,7,137,34,223,2,222,116,9,217,251,220,249,217,192,38,222,13,217,192,216,203,175,217,194,38,222,13,220,193,216,204,222,226,175,38,138,69,3,222,4,222,4,222,124,77,220,201,38,222,13,223,26,105,26,64,1,223,26,112,29,3,26,129,195,160,125,4,128,192,232,3,100,0,7,115,3,100,40,7,52,31,101,0,7,115,3,101,40,7,79,79,117,175,222,217,228,96,72,117,129,105,220,64,2,181,3,96,185,2,0,217,193,222,11,193,11,4,222,3,193,11,4,222,116,1,217,254,226,237,216,204,222,193,221,195,217,192,222,76,6,222,100,23,38,223,31,97,67,67,226,211,15,132,64,255,195,187,119,252,156,254,101,189,88,124,161,120,6,92,139,235,124];
  td_original.innerHTML = `<pre>  aas           ; db 3Fh: float[si-3] = 0.5
PSCALE:         ;=-16256
  db 0x80,0xC0,13h  ; long "add al,13h"
  int  10h

  add  dh,al    ; ds = cs = ss = constants, stack, scratch
  mov  fs,dx    ; teal screen
  add  dh,al
  mov  gs,dx    ; orange screen
  add  dh,al
  mov  es,dx    ; 32768 stored points (TODO: bytes are enough when normalized correctly)
  mov  bp,SHAPE+1 ; u16[bp]=shape, [bp+si]=scratch

  mov  dx,3c8h  ; vintage palette: ttttoooo (teal * orange)
  salc          ; al=0
  out  dx,al
  inc  dx
P:or   ax,1100001111000011b
  push ax
  out  dx,al    ; R
  add  al,ah
  shr  al,1
  out  dx,al    ; G
  add  al,ah
  shr  al,2
  out  dx,al    ; B
  pop  ax
  inc  ax
  jnz  P

M2:
  fninit
  fldz
  fldz
  fldz          ; {c b a} - previous points of the attractor
  dec  bp
  ;  fst    qword[bp+si+4]  ; zero MAX and -MIN (didn't make the cut)
  pop  bx

M:push di       ;=0 (after first frame) ; sp-=2 counts frames (crash after ~30k frames)
  call I

; combine orange and blue screens, store result to vram, clear them
; di=0, cx=0
  push es

S:xor  ax,ax
  xchg al,[gs:di] ; xchg reg,mem is slow but small
  xchg ah,[fs:di]
  shr  ah,4
  and  al,0xF0
  push 0xA000
WIDTH: equ $-1  ;=160
  add  al,ah
  pop  es
  stosb
  loop S

;; fade out
;S:mov  dl,0xF0
;  mov  al,[gs:di]
;  shr  byte[gs:di],1
;  and  dl,[fs:di]
;  shr  byte[fs:di],1
;  shr  al,4
;  push 0xA000
;WIDTH: equ $-1  ;=160
;  add  al,dl
;  pop  es
;  stosb
;  loop S

;; smaller fade out 2
;S:mov  al,0xF0
;  and  al,[gs:di]
;  shr  byte[gs:di],4
;  shr  byte[fs:di],4
;  push 0xA000
;WIDTH: equ $-1  ;=160
;  add  al,[fs:di]
;  pop  es
;  stosb
;  loop S

  pop  es


; draw all 32768 points with rotation and perspective
; di=0(index into points)
  mov  [bp+si],sp
  fild   word[bp+si]
  fidiv  word[byte si+9] ; {t/ROTATION_SPEED . . .}
  fsincos              ; {s c . . .}
  fdiv   st1,st0       ; {s c/s . . .}
D:
;rotate
  fld    st0           ; {s s c/s . . .}
  fimul  word[es:di]   ; {s*(x=p[i]) s c/s . . .}
  fld    st0           ; {sx sx s c/s . . .}
  fmul   st3           ; {cx sx s c/s . . .}
  scasw
  fld    st2           ; {s cx sx s c/s . . .}
  fimul  word[es:di]   ; {s*(z=p[i+1]) cx sx s c/s . . .}
  fadd   st1,st0       ; {sz sz+cx sx s c/s . . .}
  fmul   st4           ; {cz sz+cx sx s c/s . . .}
  fsubrp st2,st0       ; {Z=sz+cx X=cz-sx s c/s . . .}
  scasw
  mov  al,[es:di+3]    ; (color=p[i+3]>>8): -128..127

  fiadd  word[si]      ; {Z+BIG X s c . . .}
  fiadd  word[si]      ; {Z+2*BIG X s c . . .}
  fidivr word[byte si-100h+WIDTH]; {w=WIDTH/(Z+2*BIG) X s c . . .}

  fmul   st1,st0       ; {w X*w s c . . .}
  fimul  word[es:di]   ; {(Y=p[i+2])*w X*w s c/s . . .}
  fistp  word[bp+si]   ; Y*w {X*w s c . . .}
  imul bx,[bp+si],320
  fistp  word[bp+si]   ; X*w {s c . . .}
  jo   O               ; handle Y overflow
  add  bx,[bp+si]
  add  bx,100*320+160  ; bx = adr = (iy+100)*320 + (ix+160)

  add  al,128
  shr  al,3            ; 0..31

C:add  [fs:bx],al
  jnc  E
  sub  [fs:bx],al      ; cheap saturate
E:
  xor  al,255>>3       ; 31..0

  add  [gs:bx],al
  jnc  F
  sub  [gs:bx],al
F:

O:dec  di
  dec  di
  jnz  D               ; i++

  fcompp               ; get rid of rotation coefficients {. . .}

; esc check
  in   al,60h
  dec  ax
  jnz  M

; my custom variation of the Pickover attractor: c,b,a = a*sin(p0*c+p1)+sin(p2*b+p3),c,b
; generate about 500 new points for nice fadeout
I:imul bx,sp,512+64 ; where to start overwriting old points: sp decreases by 2
  mov  ch,512/256+1

R:pusha

  mov  cx,2          ; {c b a}
H:fld    st1         ; {b c b a}              ; {c sin(p0*b+p1) c b a}
  fimul  word[bp+di] ; {p0*b c b a}           ; {p2*c sin(p0*b+p1) c b a}
  ror  word[bp+di],4
  fiadd  word[bp+di] ; {p0*b+p1 c b a}        ; {p2*c+p3 sin(p0*b+p1) c b a}
  ror  word[bp+di],4
  fidiv  word[byte si-100h+PSCALE]
  fsin               ; {sin(p0*b+p1) c b a}   ; {sin(p2*c+p3) sin(p0*b+p1) c b a}
  loop H

  fmul   st4         ; {a*sin(p2*c+p3) sin(p0*b+p1) c b a}
  faddp  st1,st0     ; {a*sin(p2*c+p3)+sin(p0*b+p1) c b a}
  ffree  st3         ; {d=a*sin(p2*c+p3)+sin(p0*b+p1) c b}  ; can preserve rest of stack with 2*fxch


; min-max normalization: didn't make the cut

; [B]=MAX=max(d_i), [B+4]=MAX2=max(-d_i) = -min(d_i)
; branchless min: mid = (a+b)/2; radius = abs(a-b)/2; max = mid+radius
; the qword zero store is necessary

;;  fld    st0
;;  fchs               ; {-d d . .}
;;  mov  cl,2
;;L:add  bp,4
;;  fld    st1         ; {d -d d . .}                  ; {-d MAX -d d . .}
;;  fadd   dword[bp+si]; {d+MAX -d d . .}              ; {-d+MAX2 MAX -d d . .}
;;  fld    st2         ; {d d+MAX -d d . .}            ; {-d -d+MAX2 MAX -d d . .}
;;  fsub   dword[bp+si]; {d-MAX d+MAX -d d . .}        ; {-d-MAX2 -d+MAX2 MAX -d d . .}
;;  fabs               ; {abs(d-MAX) d+MAX -d d . .}   ; {abs(-d-MAX2) -d+MAX2 MAX -d d . .}
;;  faddp  st1,st0     ; {2*max(d,MAX) -d d . .}       ; {2*max(-d,MAX2) MAX -d d . .}
;;  fmul   dword[si-3]; {MAX=max(d,MAX) -d d . .}     ; {MAX2=max(-d,MAX2) MAX -d d . .}
;;  fst    dword[bp+si]; {MAX -d d . .}                ; {-MIN=MAX2 MAX -d d . .}
;;  loop L
;;
;;; normalize
;;  fadd   st1,st0     ; {-MIN MAX-MIN -d . . .}
;;  fsubrp st2,st0     ; {MAX-MIN d-MIN . . .}
;;  fdivp  st1,st0     ; {d(0..1)=(d-MIN)/(MAX-MIN) . . .}
;;  fadd   st0         ; {d(0..2) . . .}
;;  fimul  word[si] ; {d(0..2*BIG) . . .}
;;  fisub  word[si] ; {d(-BIG..BIG) . . .}


; no normalization, larger, messier
  fld    st0           ; 0..1 -> -12k..12k
  fimul  word[si+6]
  fisub  word[si+0x17]

  fistp  word[es:bx]
  popa

  inc  bx
  inc  bx
  loop R
  jz   M2  ; switch to the next attractor if we hit 0 = every 170 frames
; the jump was after "I:imul", but zero flag after imul is undocumented!

  ret

; parameters (words) that work nicely together even when stepping by bytes
; will overflow into code, nobody cares
  ;db 0x98, 0x67, 0xfc
  db 0xbb, 0x77, 0xfc, 0x9c, 0xfe, 0x65, 0xBD, 0x58, 0x7C, 0xA1, 0x78
  db 0x06, 0x5C, 0x8B, 0xEB, 0x7C
  ;db 0x08, 0x80, 0x5F, 0xC6
SHAPE: equ $-2`;
  cpu_mode = 32;
  disassemble();
}
  
// SYMETRIE
symetrie.onclick = e => {
  bytes = [184,19,0,205,16,0,198,142,218,0,198,142,226,104,0,160,7,214,186,200,3,238,66,13,195,15,80,193,232,10,238,246,224,193,232,6,238,88,238,64,117,237,15,49,54,102,137,4,219,227,54,102,255,4,54,219,4,136,2,222,50,217,235,216,201,217,254,217,193,217,254,216,192,217,234,216,203,217,254,100,138,37,138,5,193,232,4,36,15,100,40,37,40,5,213,16,170,226,236,191,160,125,187,65,1,253,100,138,20,172,0,0,208,24,100,0,16,100,208,24,226,240,247,219,252,120,235,193,235,7,217,194,117,227,30,102,64,102,107,192,3,114,24,102,199,2,3,0,0,191,216,10,223,2,217,250,216,201,217,202,245,114,243,222,226,222,194,120,33,15,160,31,115,2,216,194,217,193,216,200,217,193,216,200,222,193,217,236,115,2,216,205,222,241,220,202,222,201,115,2,216,196,198,2,55,217,192,222,10,223,27,105,27,64,1,112,24,198,2,66,217,193,222,10,223,27,3,27,178,255,42,17,192,234,5,0,17,247,219,0,17,31,226,146,228,96,72,15,133,53,255,176,3,205,16,195];
  td_original.innerHTML = `<pre>  mov  ax,13h
  int  10h          ; MCGA video mode

  add  dh,al        ; needs 76+76+64 = 216kB free memory
  mov  ds,dx
  add  dh,al        ; ds: blue plane
  mov  fs,dx        ; fs: orange plane
  push 0a000h       ; es: screen
  pop  es           ; ss: fpu<>cpu

;Palette: 4 bits black>red>yellow | 4 bits black>blue

  salc              ; al = 0
  mov  dx,3C8h
  out  dx,al
  inc  dx
P or   ax,0000111111000011b
  push ax           ; ax = rrrr1111 11bbbb11
  shr  ax,10
  out  dx,al
  mul  al
  shr  ax,6
  out  dx,al        ; g = r*r
  pop  ax
  out  dx,al
  inc  ax           ; b overflows to r
  jnz  P

  rdtsc           ; ; comment for compatibility: T = 3439334328
  mov  [ss:si],eax; ; T = random()

;Main loop

M fninit
  inc  dword[ss:si]
  fild  dword[ss:si]
  mov  [bp+si],al
  fidiv word[bp+si] ; {t = ++T/scancode}

  fldpi
  fmul  st1
  fsin
  fld   st1
  fsin
  fadd  st0
  fldl2e
  fmul  st3
  fsin              ; {u=sin(1.443*t) v=2*sin(t) w=sin(3.142*t) t}

;Blit, fade out

F mov  ah,[fs:di]   ; combine planes
  mov  al,[di]      ; screen = (Orange & 0xF0) + (Blue>>4 & 0x0F)
  shr  ax,4
  and  al,1111b
  sub  [fs:di],ah   ; Orange *= 15/16, Blue *= 15/16
  sub  [di],al
  aad  16           ; ah=0
  stosb
  loop F            ; cx=0

  mov  di,32000+160 ; center of the screen

;Gaussian blur (both planes)

  mov  bx,321       ; 1 2 1
G std               ; 2 4 2 / 16
B mov  dl,[fs:si]   ; 1 2 1
  lodsb
  add  [bx+si],al
  rcr  byte[bx+si],1
  add  [fs:bx+si],dl
  rcr  byte[fs:bx+si],1
  loop B
  neg  bx
  cld
  js   B            ; +/- pass
  shr  bx,7
  fld   st2         ; {y=v x=w u v w t}
  jnz  G            ; vertical/horizontal pass

;Iteration loop

I push ds           ; P = Blue

  inc  eax          ; RAND++, set sign flag
  imul eax,byte 3   ; RAND*=3, set carry flag

;If (!carry), rotate by 240 degrees

  jc   C
  mov  dword[bp+si],0xBF000003
R fmul  dword[bp+si]
  fild  word[bp+si] ; c = cos(4pi/3) = -1/2
  fsqrt             ; s = sin(4pi/3) = -sqrt(3)/2
  fmul  st1
  fxch  st2         ; {x cy sy u v w t}
  cmc
  jc   R            ; run twice: {cy cx sx sy u v w t}
  fsubrp st2
  faddp st2         ; {y=-sx+cy x=cx+sy u v w t}

;If (!sign), apply circle inversion and translation

C js   S
  push fs
  pop  ds           ; P = Orange

  jnc  D
  fadd  st2         ; if (carry) y+=u
D fld   st1
  fmul  st0
  fld   st1
  fmul  st0
  faddp st1         ; {x*x+y*y y x u v w t}
  fldlg2
  jnc  E
  fmul  st5
E fdivrp st1        ; r = (carry ? lg2*v : lg2) / (x*x+y*y)
  fmul  st2,st0
  fmulp st1         ; {y*=r x*=r u v w t}
  jnc  S
  fadd  st4         ; if (carry) y+=w

;Convert coords, clip, draw pixel

S mov  byte[bp+si],ZOOM*5/6 ; upper byte is zero
  fld   st0
  fimul word[bp+si]
  fistp word[bp+di] ; iy = y*ZOOMY
  imul bx,[bp+di],320
  jo   O            ; if (|iy|>102), don't draw (can be "jc")

  mov  byte[bp+si],ZOOM
  fld   st1
  fimul word[bp+si]
  fistp word[bp+di] ; ix = x*ZOOMX, don't bother with overflow
  add  bx,[bp+di]   ; adr = (iy+100)*320 + ix+160

  mov  dl,255
  sub  dl,[bx+di]
  shr  dl,5         ; blend with max color
  add  [bx+di],dl   ; P[adr] = (255 + P[adr]*31)/32

  neg  bx
  add  [bx+di],dl   ; central symmetry

O pop  ds
  loop I

;Keycheck, exit

  in   al,60h
  dec  ax           ;-) ah=0 from blit and 65536 iterations
  jnz  near M
  mov  al,3
  int  10h          ; text mode
  ret`;
  cpu_mode = 32;
  disassemble();
}
  
// TUBE
tube.onclick = e => {
  bytes = [176,19,205,16,104,0,160,7,140,200,128,196,16,142,224,49,201,186,200,3,137,200,238,66,208,248,120,7,238,246,224,193,232,6,238,176,0,238,121,8,40,200,208,232,238,208,232,238,137,203,100,136,31,226,218,137,203,1,200,211,192,136,198,192,254,5,16,242,100,18,151,255,0,208,234,100,136,23,246,215,100,136,23,226,226,219,227,217,238,128,199,8,191,4,2,216,69,244,87,186,176,255,189,96,255,190,252,1,223,68,214,137,44,223,4,137,20,223,4,177,2,217,195,217,251,217,194,216,201,217,196,216,203,222,233,217,203,222,202,222,203,222,194,217,202,226,230,217,193,220,200,217,193,220,200,222,193,217,250,222,251,217,243,222,76,252,223,28,222,76,252,223,92,1,139,52,141,0,0,224,36,64,176,251,116,15,193,230,2,141,0,40,224,176,240,121,4,209,230,176,208,100,2,0,0,5,71,69,129,253,160,0,117,147,66,131,250,80,117,138,94,191,0,25,181,100,243,165,181,200,78,192,60,2,226,250,228,96,152,72,15,133,101,255,176,3,205,16,41,0,195,60,98,97,122,101];
  td_original.innerHTML = `<pre>	mov	al,13h
	int	10h

	push	word 0A000h
	pop	es
	mov	ax,cs
	add	ah,10h
	mov	fs,ax

	xor	cx,cx
PAL1	mov	dx,3C8h
	mov	ax,cx
	out	dx,al
	inc	dx
	sar	al,1
	js	PAL2
	out	dx,al
	mul	al
	shr	ax,6
	out	dx,al
PAL2	mov	al,0
	out	dx,al
	jns	PAL3
	sub	al,cl
	shr	al,1
	out	dx,al
	shr	al,1
	out	dx,al
PAL3	mov	bx,cx
	mov	[fs:bx],bl
	loop	PAL1

TEX	mov	bx,cx
	add	ax,cx
	rol	ax,cl
	mov	dh,al
	sar	dh,5
	adc	dl,dh
	adc	dl,[fs:bx+255]
	shr	dl,1
	mov	[fs:bx],dl
	not	bh
	mov	[fs:bx],dl
	loop	TEX

	fninit
	fldz

MAIN	add	bh,8
	mov	di,PIXBUF
	fadd	dword [byte di-PIXBUF+TEXUV-4]
	push	di

	mov	dx,-80
TUBEY	mov	bp,-160
TUBEX	mov	si,TEXUV
	fild	word [byte si-TEXUV+EYE]

	mov	[si],bp
	fild	word [si]
	mov	[si],dx
	fild	word [si]

	mov	cl,2
ROTATE	fld	st3
	fsincos
	fld	st2
	fmul	st0,st1
	fld	st4
	fmul	st0,st3
	fsubp	st1,st0
	fxch	st0,st3
	fmulp	st2,st0
	fmulp	st3,st0
	faddp	st2,st0
	fxch	st0,st2
	loop	ROTATE

	fld	st1
	fmul	st0,st0
	fld	st1
	fmul	st0,st0
	faddp	st1,st0
	fsqrt
	fdivp	st3,st0
	fpatan
	fimul	word [si-4]
	fistp	word [si]
	fimul	word [si-4]
	fistp	word [si+1]
	mov	si,[si]

	lea	ax,[bx+si]
	add	al,ah
	and	al,64
	mov	al,-5
	jz	STORE

	shl	si,2
	lea	ax,[bx+si]
	sub	al,ah
	mov	al,-16
	jns	STORE

	shl	si,1
	mov	al,-48
STORE	add	al,[fs:bx+si]
	add	[di],al
	inc	di

	inc	bp
	cmp	bp,160
EYE	equ	$-2
	jnz	TUBEX

	inc	dx
	cmp	dx,byte 80
	jnz	TUBEY

	pop	si
	mov	di,(100-SCREEN/2)*320
	mov	ch,(SCREEN/2)*320/256
	rep	movsw

	mov	ch,SCREEN*320/256
BLUR	dec	si
	sar	byte [si],2
	loop	BLUR

	in	al,60h
	cbw
	dec	ax
	jnz	near MAIN

	mov	al,03h
	int	10h

	db	41,0,0C3h,3Ch
TEXUV	db	"baze"`;
  cpu_mode = 32;
  disassemble();
}

// MOTION SICKNESS
ms.onclick = e => {
  bytes = [233,194,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,72,69,32,69,78,68,13,10,10,10,10,32,32,32,32,32,32,32,45,45,45,45,32,77,111,116,105,111,110,32,83,105,99,107,110,101,115,115,32,45,45,45,45,10,13,10,13,10,10,10,10,32,32,32,32,32,32,32,65,32,52,107,32,105,110,116,114,111,32,98,121,32,121,111,98,105,47,119,65,77,77,65,10,13,10,13,10,10,10,10,32,32,32,32,32,32,32,82,101,108,101,97,115,101,100,32,97,116,32,97,115,115,101,109,98,108,121,32,50,48,48,49,36,128,0,0,0,0,220,0,128,128,0,0,0,0,0,142,6,15,1,176,255,191,255,254,185,0,2,243,170,51,255,185,0,1,38,136,5,38,136,133,255,0,129,199,0,1,226,242,195,142,6,3,1,142,38,15,1,161,39,4,5,160,0,37,255,3,150,199,6,153,1,64,1,139,222,209,227,139,175,0,131,102,193,229,16,139,175,0,129,86,102,139,14,147,1,190,32,0,178,199,139,62,153,1,129,199,191,248,142,46,11,1,138,253,102,193,193,16,138,221,102,193,193,16,100,138,7,60,255,15,132,185,0,50,228,247,216,3,6,151,1,193,224,7,82,153,247,254,5,99,0,163,155,1,153,247,210,35,194,61,199,0,114,4,144,144,176,199,90,58,194,15,131,131,0,100,58,55,117,31,144,144,138,242,42,240,134,208,83,208,235,208,239,101,138,7,91,38,136,5,129,239,64,1,254,206,117,245,235,90,144,83,81,86,85,2,223,193,227,8,51,201,138,202,42,200,134,208,82,139,198,139,232,51,210,131,62,155,1,0,125,11,144,144,139,22,155,1,247,218,247,234,146,81,139,193,193,224,6,193,225,8,3,193,43,248,89,80,30,142,30,9,1,139,242,193,238,8,138,0,38,136,5,3,213,129,199,64,1,226,238,31,88,43,248,90,93,94,89,91,132,210,116,14,144,144,100,138,55,102,3,205,131,198,2,233,50,255,94,78,129,230,255,3,255,14,153,1,15,133,253,254,195,195,0,0,0,0,0,0,96,30,14,31,255,6,224,2,176,32,230,32,31,97,207,8,0,56,0,142,6,3,1,30,142,30,11,1,102,51,255,102,51,246,102,185,128,62,0,0,243,102,165,31,195,80,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,142,6,3,1,142,38,15,1,161,19,3,5,32,0,163,25,3,199,6,27,3,32,0,139,30,25,3,184,0,236,153,247,251,3,6,15,3,163,29,3,184,0,20,153,247,251,3,6,15,3,43,6,29,3,163,31,3,184,16,220,153,247,251,3,6,17,3,163,33,3,184,240,35,153,247,251,3,6,17,3,43,6,33,3,163,35,3,184,0,128,51,210,247,54,35,3,163,41,3,199,6,37,3,0,0,184,0,32,51,210,247,54,31,3,163,39,3,161,33,3,139,216,193,224,8,193,227,6,3,195,3,6,29,3,139,248,139,30,27,3,209,227,193,227,6,161,37,3,193,232,8,209,224,3,216,51,192,138,135,0,80,60,31,119,56,144,144,139,240,193,230,7,138,167,0,96,192,236,2,51,210,139,46,41,3,51,219,139,14,35,3,138,222,100,138,0,132,192,116,13,144,144,51,219,138,217,138,135,0,128,38,136,5,3,213,129,199,64,1,226,226,161,39,3,1,6,37,3,255,6,29,3,255,14,31,3,117,135,131,46,25,3,2,255,14,27,3,15,133,28,255,195,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,128,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,83,81,147,185,255,255,65,139,193,247,232,59,195,114,247,145,89,91,195,145,153,0,0,0,0,51,255,100,138,69,1,100,42,69,255,100,138,165,0,1,100,42,165,0,255,2,196,4,92,38,136,5,71,117,228,195,51,255,51,192,38,138,69,255,38,2,69,1,128,212,0,38,2,133,0,255,128,212,0,38,2,133,0,1,128,212,0,193,232,2,38,136,5,71,117,220,195,161,156,4,83,82,187,229,3,247,227,64,163,156,4,193,232,7,90,91,163,158,4,195,161,224,2,61,133,0,114,25,144,144,161,17,1,43,6,224,2,61,133,0,127,64,144,144,61,0,0,125,4,144,144,51,192,139,208,142,6,3,1,51,255,51,192,189,200,0,185,64,1,139,221,128,227,63,193,227,6,138,193,36,63,3,216,56,151,0,64,114,11,144,144,138,135,0,64,51,192,38,136,5,71,226,222,77,117,216,195,186,218,3,236,36,8,117,251,236,36,8,116,251,195,104,0,160,7,30,142,30,3,1,102,51,255,102,51,246,102,185,128,62,0,0,243,102,165,31,195,161,224,2,209,232,163,143,1,5,128,0,163,145,1,129,38,145,1,255,0,129,38,143,1,255,0,161,143,1,193,224,2,163,39,4,139,54,145,1,209,230,187,100,0,139,132,0,32,247,235,5,0,127,163,147,1,139,132,128,32,247,235,5,0,127,163,149,1,195,140,216,5,0,16,163,3,1,5,0,16,163,5,1,5,0,16,163,9,1,5,0,16,163,11,1,5,0,16,163,7,1,5,0,16,163,13,1,5,0,16,163,15,1,5,0,2,184,19,0,205,16,180,53,176,8,205,33,140,6,220,2,137,30,222,2,180,37,176,8,186,226,2,205,33,250,176,54,230,67,96,97,185,149,66,138,193,230,64,96,97,138,197,230,64,96,97,251,30,7,191,0,48,185,0,1,139,193,193,232,3,44,16,246,232,42,196,192,232,4,4,240,170,226,237,190,126,34,191,128,32,30,7,185,128,0,184,192,0,43,193,247,233,247,233,193,232,11,254,204,193,226,5,3,194,137,4,137,132,0,254,171,78,78,226,226,142,6,7,1,51,255,51,192,185,0,128,243,171,51,246,51,210,184,0,128,139,200,50,210,138,253,138,220,38,136,55,3,140,0,32,129,249,0,1,114,32,144,144,129,249,0,255,119,24,144,144,3,132,128,32,61,0,1,114,13,144,144,61,0,255,119,6,144,144,254,194,117,207,131,198,2,254,198,117,193,190,1,0,189,128,0,191,128,0,38,138,5,186,0,1,185,128,0,38,128,61,0,116,5,144,144,38,138,5,38,136,5,3,254,226,238,3,253,74,117,230,78,117,10,144,144,190,255,255,189,128,1,235,208,142,6,9,1,51,255,51,192,185,0,128,243,171,199,6,160,4,100,0,232,227,253,139,62,158,4,193,231,8,232,217,253,3,62,158,4,187,224,255,185,224,255,139,193,247,232,149,139,195,247,232,3,197,193,232,7,247,216,5,8,0,61,0,0,126,5,144,144,38,0,5,71,65,131,249,32,124,220,129,199,192,0,67,131,251,32,124,207,255,14,160,4,117,181,142,6,5,1,142,38,7,1,51,255,178,240,182,240,177,240,138,193,246,232,149,138,198,246,232,3,232,138,194,246,232,3,197,51,219,61,160,0,127,12,144,144,138,218,128,195,16,208,235,192,227,4,128,250,240,117,21,144,144,138,193,246,232,149,138,198,246,232,3,197,193,232,6,42,196,4,4,147,38,136,29,138,193,246,232,149,138,198,246,232,3,232,138,194,246,216,4,16,246,232,193,232,2,51,219,59,197,124,14,144,144,138,218,246,219,128,195,16,208,235,192,227,4,128,250,241,127,19,144,144,138,193,4,16,138,230,128,196,16,50,196,208,232,192,224,4,147,38,136,157,0,128,71,254,193,128,249,16,15,140,110,255,254,198,128,254,16,15,140,99,255,254,194,128,250,16,15,140,88,255,191,0,64,51,201,50,201,138,193,44,32,246,232,149,138,197,44,32,246,232,3,197,193,232,4,147,232,202,252,36,15,2,195,136,5,71,254,193,128,249,64,114,220,254,197,128,253,64,114,211,30,7,191,0,80,187,224,255,185,224,255,139,193,247,232,149,139,195,247,232,3,197,232,59,252,170,65,131,249,32,124,235,67,131,251,32,124,226,30,7,30,142,30,7,1,191,0,96,190,96,96,186,64,0,185,32,0,243,165,129,198,192,0,74,117,244,31,142,6,13,1,142,38,7,1,51,255,190,48,23,187,156,255,185,176,255,139,193,247,232,149,139,195,247,232,3,197,232,240,251,138,224,100,138,4,171,70,65,131,249,80,124,229,131,198,96,67,131,251,100,124,217,30,7,191,0,112,187,1,0,184,0,8,51,210,247,243,170,254,195,117,244,30,7,191,0,128,51,201,139,217,193,227,2,129,227,255,0,209,227,139,135,0,32,5,0,1,193,232,6,131,195,20,129,227,255,1,139,151,0,32,129,194,0,1,193,234,6,193,226,5,3,194,170,254,193,117,207,186,200,3,176,7,238,66,50,192,238,238,238,186,19,1,180,9,205,33,104,0,160,15,161,30,7,186,8,0,51,246,191,0,160,185,64,0,100,138,4,100,198,4,0,170,70,226,245,129,198,0,1,74,117,235,199,6,224,2,0,0,232,29,252,186,200,3,176,7,238,66,161,224,2,193,232,2,238,238,238,129,62,224,2,210,0,114,229,199,6,224,2,0,0,129,62,224,2,210,0,114,248,199,6,224,2,0,0,232,238,251,186,200,3,176,7,238,66,184,210,0,43,6,224,2,193,232,2,238,238,238,129,62,224,2,210,0,114,225,104,0,160,7,51,192,51,255,185,0,125,243,171,186,200,3,50,192,238,66,179,0,177,0,138,193,238,138,193,2,195,208,232,238,138,195,238,128,193,4,128,249,63,118,235,128,195,4,128,251,63,118,225,199,6,17,1,120,5,199,6,224,2,0,0,139,30,224,2,193,235,2,129,227,255,0,137,30,39,4,209,227,139,135,0,32,247,216,193,224,7,5,0,128,163,41,4,139,135,128,32,247,216,193,224,7,5,0,128,163,43,4,139,135,0,32,193,224,5,45,0,16,163,45,4,142,6,3,1,142,38,5,1,139,30,39,4,131,235,32,129,227,255,0,209,227,139,135,0,32,163,49,4,139,135,128,32,163,47,4,139,30,39,4,131,195,32,129,227,255,0,209,227,139,135,0,32,163,53,4,139,135,128,32,163,51,4,161,65,4,163,6,11,199,6,59,4,0,0,131,62,59,4,16,114,7,144,144,51,255,235,4,144,191,192,123,199,6,61,4,100,0,131,62,59,4,16,114,16,144,144,139,30,61,4,247,219,209,227,186,0,193,235,14,144,187,201,0,161,61,4,209,224,43,216,186,0,63,161,59,4,247,216,193,224,9,3,194,43,6,45,4,153,247,251,149,161,47,4,247,237,3,6,41,4,163,55,4,161,51,4,43,6,47,4,187,64,1,247,237,247,251,163,39,3,161,49,4,247,237,3,6,43,4,163,57,4,161,53,4,43,6,49,4,247,237,247,251,163,41,3,161,41,3,163,22,11,163,47,11,163,91,11,161,55,4,139,22,57,4,139,46,39,3,139,54,59,4,193,230,11,131,62,59,4,16,114,67,144,144,142,46,9,1,185,64,1,138,222,138,252,101,138,159,52,18,101,2,31,50,255,138,159,0,48,38,136,29,129,194,255,255,3,197,71,226,226,235,67,144,185,64,1,138,222,138,252,101,138,31,38,136,29,129,194,255,255,3,197,71,226,237,235,42,144,185,64,1,138,222,128,227,31,193,227,5,2,220,128,215,0,129,227,255,3,100,138,24,132,219,116,5,144,144,38,136,29,129,194,52,18,3,197,71,226,218,255,14,61,4,15,133,250,254,255,6,59,4,131,62,59,4,17,15,130,214,254,232,135,249,232,233,249,161,224,2,193,224,8,2,6,224,2,163,65,4,228,96,60,1,15,132,5,5,161,17,1,57,6,224,2,15,130,42,254,142,6,11,1,142,38,9,1,51,255,186,200,0,185,64,1,138,217,138,250,100,138,7,192,232,2,100,138,167,10,10,192,236,2,192,228,4,2,196,38,136,5,71,73,117,226,74,117,220,199,6,17,1,188,2,199,6,224,2,0,0,139,30,224,2,50,255,209,227,139,135,0,32,5,0,1,193,232,3,5,32,0,163,241,2,139,30,224,2,209,227,50,255,209,227,139,135,0,32,5,0,1,193,232,3,5,32,0,163,243,2,232,230,246,142,6,15,1,51,201,139,249,51,219,139,193,43,6,241,2,247,232,149,139,195,247,232,3,232,184,255,127,51,210,69,247,245,139,240,139,193,43,6,243,2,247,232,149,139,195,247,232,3,232,184,255,127,51,210,69,247,245,3,198,149,51,192,129,253,128,0,114,4,144,144,176,3,170,131,199,127,67,131,251,32,114,183,65,129,249,128,0,114,172,232,191,246,232,146,248,232,244,248,228,96,60,1,15,132,29,4,161,17,1,57,6,224,2,15,130,85,255,199,6,17,1,120,5,199,6,224,2,0,0,142,6,15,1,51,255,51,192,185,0,16,243,171,142,38,5,1,51,237,51,255,187,1,0,139,197,193,224,8,247,216,5,192,63,51,210,247,243,139,245,139,208,193,234,7,193,230,10,3,6,69,4,193,232,3,37,15,0,193,224,6,3,240,185,32,0,51,192,100,138,132,0,128,132,192,116,16,144,144,192,232,4,43,194,115,4,144,144,51,192,38,136,5,70,71,226,225,254,195,128,251,140,114,176,69,131,253,32,124,165,142,6,3,1,142,38,13,1,142,46,15,1,51,255,51,246,185,0,125,100,139,28,51,192,138,199,193,224,5,131,227,31,3,216,101,138,7,138,224,171,131,198,2,226,230,232,210,247,232,52,248,161,224,2,209,224,50,228,163,69,4,228,96,60,1,15,132,83,3,161,17,1,57,6,224,2,15,130,66,255,199,6,17,1,120,5,199,6,224,2,0,0,142,6,15,1,142,38,7,1,139,46,71,4,51,255,51,192,139,221,192,235,6,192,239,6,2,223,128,227,1,116,44,144,144,51,219,139,197,139,216,37,63,0,193,235,8,128,227,63,193,227,6,3,216,50,192,128,191,0,80,15,119,13,144,144,139,221,129,227,63,63,100,138,135,96,96,38,136,5,69,71,117,188,142,6,5,1,142,38,15,1,142,46,9,1,51,246,51,201,139,46,71,4,139,249,193,239,8,184,0,128,139,208,177,128,138,254,138,220,100,128,63,0,117,39,144,144,3,221,101,138,31,192,235,2,138,251,192,231,4,2,223,38,136,29,3,148,0,32,3,132,128,32,129,199,0,1,254,201,117,210,235,32,144,100,138,31,51,237,62,138,190,0,112,101,138,7,192,232,2,192,224,4,38,136,5,129,199,0,1,69,254,201,117,230,131,198,2,254,197,117,153,142,6,3,1,142,38,13,1,142,46,5,1,51,255,51,246,185,0,128,100,139,28,132,219,116,8,144,144,101,138,7,138,224,171,131,198,2,226,236,232,179,246,232,21,247,139,30,224,2,50,255,209,227,139,135,0,32,189,10,0,247,237,189,25,0,153,247,253,193,224,8,145,139,135,128,32,189,10,0,247,237,189,25,0,153,247,253,3,193,5,32,32,163,71,4,228,96,60,1,15,132,12,2,161,17,1,57,6,224,2,15,130,197,254,30,7,191,0,129,190,0,32,185,64,1,173,171,139,44,131,249,1,119,5,144,144,189,255,0,43,232,149,187,5,0,153,247,251,149,186,3,0,3,197,171,74,117,250,226,221,142,46,9,1,142,38,11,1,142,6,3,1,51,246,232,21,246,38,136,4,70,117,247,232,227,245,232,224,245,232,221,245,142,6,11,1,142,38,3,1,232,179,245,51,246,38,138,4,192,232,4,138,224,192,228,4,2,196,38,136,4,70,117,237,142,38,9,1,142,6,3,1,51,246,101,138,4,192,232,2,101,138,164,4,4,192,236,2,192,228,4,2,196,38,136,4,70,117,231,142,6,9,1,30,142,30,3,1,51,255,51,246,185,0,128,243,165,31,142,6,15,1,51,255,184,240,240,185,0,128,243,171,51,255,139,199,44,128,246,232,149,139,199,138,196,44,128,246,232,3,197,61,25,59,119,5,144,144,38,136,21,71,117,226,232,50,242,199,6,17,1,120,5,199,6,224,2,0,0,142,6,3,1,184,68,68,51,255,185,0,125,243,171,142,6,15,1,139,46,224,2,209,229,191,64,64,186,128,0,185,128,0,139,217,209,227,3,221,129,227,255,0,209,227,139,135,0,32,139,218,209,227,129,227,255,0,209,227,3,135,0,32,5,0,2,193,232,3,36,240,38,136,5,71,226,212,129,199,128,0,74,117,202,232,178,245,232,238,241,232,45,245,232,143,245,228,96,60,1,15,132,184,0,161,17,1,57,6,224,2,114,143,142,6,15,1,51,255,184,240,240,185,0,128,243,171,51,255,139,199,44,128,246,232,149,139,199,138,196,44,128,246,232,3,197,61,25,59,119,5,144,144,38,136,21,71,117,226,232,132,241,142,6,15,1,190,0,160,191,72,120,186,8,0,185,64,0,172,60,7,117,38,144,144,184,255,255,38,199,5,31,31,38,199,133,0,1,31,31,38,199,133,0,2,31,31,38,199,133,0,3,31,31,38,199,133,0,4,31,31,131,199,2,226,208,129,199,128,2,74,117,198,199,6,17,1,188,2,199,6,224,2,0,0,142,6,3,1,184,68,68,51,255,185,0,125,243,171,232,3,245,232,63,241,232,126,244,232,224,244,228,96,60,1,116,11,144,144,161,17,1,57,6,224,2,114,213,180,37,176,8,30,139,22,222,2,142,30,220,2,205,33,31,250,176,54,230,67,51,192,230,64,138,224,230,64,251,180,2,205,26,179,10,138,197,192,232,4,246,227,128,229,15,2,197,138,232,138,193,192,232,4,246,227,128,225,15,2,193,138,200,138,198,192,232,4,246,227,128,230,15,2,198,138,240,50,210,180,45,205,33,184,3,0,205,16,195];
  td_original.innerHTML = "N/A";
  cpu_mode = 32;
  disassemble();
}

xor.onclick();
xor.focus();