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
; Metropole a 256 bytes intro by Baudsurfer/RSI 2015 aka olivier.poudade.free.fr
; Presented first at the Function 2015 demoscene demo party in Budapest Hungaria
; Greets Blabla Conscience Bon^2 BReWErS CODEX Flush Lineout Mandarine Onslaught
; Paranoimia Quartex Rebels Razor1911 RiOT Titan and to all assembly programmers
; rsi.untergrund.net twitter.com/red_sector_inc facebook.com/redsectorinc ircnet
; RSI asciilogo by sEnsER/BRK vidcap youtube.com/watch?v=Z8Av7Sc7yGY by Fra/MDRN 
;*******************************************************************************
b equ byte                 ; tested on xp, freedos, ms windows dos and its debug
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
p db "megapole$"           ; hardcoded 24h terminated ascii string of demo title