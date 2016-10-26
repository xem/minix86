; *         **  %%% ### 4is256
; * %  @@@@  ** %   #   a 256-byte brick game
; **%%      #    ==  @@ by Rrrola
;   %  ==== ### ==   @@ <rrrola@gmail.com>

; STORY
;  confused bricks fall down the pit of sorrow
;  show them the rightful way of flawless rows
;  make them complete
;  make them disappear in joy
;  and get awarded for their redemption

; CONTROLS AND SHIFTS
;  left shift ......... move left
;  right shift ....... move right
;  ctrl .............. rotate ccw
;  alt .............. fall faster

; SCORING
;  fast falling ........... 1/row
;  deleted rows ... 32/96/160/224
;  don't delete too fast ... -256 (punishment for the greedy ;-))

; LEVEL (FALLING SPEED)
;  increases every (1<<level) deletions

; note: needs vertical retrace for timing (fullscreen or pure DOS)
; greets to everyone who JUST WOULDN'T GET THE STRAIGHT ONE OMGWTF


HEIGHT     equ 24  ; must be a multiple of 4
WIDTH      equ 10  ; 4..23
PIT_CHAR   equ 'º'
BRICK_CHAR equ 'Û'

org 100h   ; assume ax=0 bl=0 sp=0FFFEh

inc  ax
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
S: db 0F0h, 63h, 74h, 71h, 36h, 72h, 33h
