;  __  _______  __
;  \_|/\||_||/\|_/
;   // /||_||\ \\
;  /symetrie 256b\
; intrrro by Rrrola
;rrrolaATgmailDOTcom

; greets to everyone with a six-letter name
; thanks to Pirx for rdtsc info
; use the keyboard to control speed

  ZOOM equ 66
  org 100h ; assume si=100h bp=9??h dx=cs

;Initialization

  mov  ax,13h
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
  ret
