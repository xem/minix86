// =======
// Globals
// =======

cp437 = " ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";

// CPU mode (32-bit by default, can switch to 16 during execution).
var cpu_mode = 32;

// 8-bit registers when they're used as operands
r8 = ["al", "1", "2", "3", "4", "5", "dh", "7"];
r16 = ["0", "cx", "2", "3", "4", "bp", "6", "7", "ax", "cx", "dx", "bx", "c", "d", "e", "f"];

// ===========
// Decompiler
// ===========
d = function(){

  address.innerHTML = "";
  hex.innerHTML = "";
  asm.innerHTML = "";
  stop = 0;

  // Loop on all bytes
  for(i = 0; i < u.length; i++){
  
  
  // Initialization
    // ===============
    
    // Current instruction's address
    a = i;
    
    // Current instruction's bytes
    b = u[i];
    
    // Second nibble of the instruction (bits 0-4)
    n = b & 0b1111;
    
    // Current instruction's length
    l = 1;
    
    // Current instruction's asm code
    c = "db " + toh(u[i]) + "          ; " + cp437[u[i]];
    
    // Operands
    o = 0;
    p = 0;
    q = 0;
    r = 0;
    
    // Parse
    // =====
    
    if(!stop){
    
    // 0x01 add r/m16/32 r16/32
    // Ref: http://ref.x86asm.net/coder32.html#x01
    if(b == 0x01){
      o = imm8();
      c = "add ";
      if(o == 0xD8){
      c += "bx,ax";
      }
    }
    
    // 0x07 pop ES
    // Ref: http://ref.x86asm.net/coder32.html#x07
    if(b == 0x07){
      c = "pop es";
    }
    
    // 0x31 xor r/m16/32 r16/32
    // Ref: http://ref.x86asm.net/coder32.html#x31
    if(b == 0x31){
      c = "xor ";
      o = imm8();
      c += modRM(o,1,1);
    }
    
    // 0x4...
    if(b >> 4 == 0x4){
    
      // 0x40 - 0x47: inc r16/32
      // Ref: http://ref.x86asm.net/coder32.html#x40
      if((b & 0b1111) < 0x8){
      c = "inc " + r16[n];
      }
      
      // 0x48 - 0x4F dec r16/32
      // http://ref.x86asm.net/coder32.html#x48
      else{
      c = "dec " + r16[n];
      }
    }
    
    // 0x68 push Imm16/32
    // Ref: http://ref.x86asm.net/coder32.html#x68
    
    if(b == 0x68){
      o = imm16();
      c = "push " + toh(o,2);
    }
    
    // 0x6B imul r16/32 r/m16/32 imm8
    // Ref: http://ref.x86asm.net/coder32.html#x6B
    if(b == 0x6B){
      o = imm8();
      p = imm8();
      c = "imul " + toh(p,1);
      if(o == 0xF3){
      c += ",bx,si";
      }
    }
    
    // 0x74 jz/je rel18
    // Ref: http://ref.x86asm.net/coder32.html#x74
    if(b == 0x74){
      o = imm8();
      c = "je ???";// + toh();
    }
    
    // 0x7E jle/jng rel18
    // Ref: http://ref.x86asm.net/coder32.html#x7E
    if(b == 0x7E){
      o = imm8();
      c = "jle ???";// + toh();
    }
    
    // 0x80 add r/m8 imm8
    // Ref: http://ref.x86asm.net/coder32.html#x80
    if(b == 0x80){
      o = imm8();
      p = imm8();
      c = "sub " + modRM(o,0) + "," + toh(p,1);
    }
    
    // 0x81 many things
    // Ref: http://ref.x86asm.net/coder32.html#x81
    if(b == 0x81){
      o = imm8();
      p = imm16();
      
      // 7: cmp r/m16/32 imm16/32
      if(o == 0xFA){
      c = "cmp " + toh(p,2) + ",dx";
      }
    }
    
    // 0x83 many things
    // Ref: http://ref.x86asm.net/coder32.html#x83
    if(b == 0x83){
      o = imm8();
      p = imm8();
      
      // 7: cmp r/m16/32 imm8
      if(o == 0xFA){
      c = "cmp " + toh(p,1) + ",dx" 
      }
    }
    
    // 0x89 mov r/m16/32 r16/32 (Op/En = MR)
    // Ref: http://ref.x86asm.net/coder32.html#x89
    // Intel manual: vol.2B 4-35 (p.715)
    if(b == 0x89){
      c = "mov ";
      o = imm8();
      c += modRM(o,1,1,1);
    }
    
    // 0x8E mov r/m16/32 r/m16 (Op/En = RM)
    // Ref: http://ref.x86asm.net/coder32.html#x8E
    if(b == 0x8E){
      c = "mov ";
      o = imm8();
      c += modRM(o,5,1);
    }

    // 0x9...
    if(b >> 4 == 0x9){
    
      // 0x90-0x97: xchg r16/32 eAX
      // Ref: http://ref.x86asm.net/coder32.html#xB0
      if((b & 0b1111) < 0x8){
      c = "xchg " + r16[(b & 0b1111)] + ", ax";
      }
      
      // 0x98 - 0x9F
      else{
      
      }
    }
    
    // 0xB...
    if(b >> 4 == 0xB){
    
      // 0xB0 - 0xB7 mov r8, Imm8
      // Ref: http://ref.x86asm.net/coder32.html#xB0
      if((b & 0b1111) < 0x8){
      o = imm8();
      c = "mov " + r8[n] + "," + toh(o,1);
      }
      
      // 0xB8 - 0xBF mov r16/32, Imm16/32
      // Ref: http://ref.x86asm.net/coder32.html#xB8
      else{
      o = imm16();
      c = "mov " + r16[n] + "," + toh(o,2);
      }
    }
    
    // 0xC3 retn
    // Ref: http://ref.x86asm.net/coder32.html#xC3
    if(b == 0xC3){
      c = "retn";
      stop = 1;
    }
    // 0xCD int imm8 eFlags
    // Ref: http://ref.x86asm.net/coder32.html#xCD
    if(b == 0xCD){
      o = imm8();
      c = "int " + toh(o,1);
    }
    
    // 0xE2 loop eCX rel18
    // Ref: http://ref.x86asm.net/coder32.html#xE2
    if(b == 0xE2){
      o = imm8();
      c = "loop " + toh(a + toSignedOffset8(o),2);
    }

    // 0xF7: many things
    // Ref: http://ref.x86asm.net/coder32.html#xF7
    if(b == 0xf7){
    
      o = imm8();
      
      // 6: div eDX eAx r/m16/32
      if(o == 0xf1){
      c = "div cx";
      }
    }
  }
    
  address.innerHTML += to16(a + 0x100, u.length > 0xFFFF ? 4: 2) + "<br>";
  hex.innerHTML+=to16(b,l).replace(/../g,"$& ") + "<br>";
  asm.innerHTML += c + "<br>";
  }
}