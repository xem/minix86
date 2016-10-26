;    _ _       |/_ _
;  A  T  R  A  K  T (O) R
; / \ |  |\/ \ |\ |     |\
;
;a 256-byte intro by rrrola <@gmail>
;greets to all of you who keep doing these

;mostly bus- and party coding

org 100h

  aas           ; db 3Fh: float[si-3] = 0.5
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
SHAPE: equ $-2
