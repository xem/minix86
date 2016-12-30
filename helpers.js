// =============================
// Helpers
// @param n: number
// @param l: length (in bytes)
// @param s: sign
// @param o: temp operand value
// =============================

// Convert a number to base 16
var to16 = (n, l) => {
  l = l || 1;
  return (1e9 + n.toString(16)).slice(-2 * l).toUpperCase();
}

// Same, with 0x prefix
var toh = (n, l) => {
  return to16(n, l) + "h";
}

// Convert a byte into a 8-bit signed offset (using 2-complement) + 2 (to include PC incrementation)
var toSignedOffset8 = (n) => {
  n = n & 0xFF;
  return (n >= 0x80 ? n - 256 : n) + 2;
}

// Read the next byte
// Updates the global vars b (instruction binary code in big endian), and l (instruction length)
var imm8 = (o) => {
  i++;
  b = (b * 256) + u[i];
  o = u[i];
  l ++;
  return o;
}

// Read the next 2 bytes in little endian
// Updates the global vars b (instruction binary code in big endian), and l (instruction length)
var imm16 = (o) => {
  o = imm8();
  i++;
  b = (b * 256) + u[i];
  o = (u[i] * 256) + o;
  l++;
  return o;
}

// Interpret a ModR/M byte in 16-bit mode
// Ref: http://ref.x86asm.net/coder32.html#modrm_byte_16
// @param s1 (optional): first operand size/type: 0: r8(/r), 1: r16(/r), 2: r32(/r), 3: mm(/r), 4: xmm(/r), 5: Sreg, 6:eee, 7: eee
// @param s2 (optional): second operand size/type
// @param oe (optional): operation encoding: 0: MR (default), 1: RM (also: 2: FD, 3: TD, 4: OI, 5: MI)
var modRM = (o, s1, s2, oe) => {
  
  var ret = "", op1, op2;
  
  /*
  
  // Mod (bits 12xxxxxx)
  var mod = (o >> 6) & 0b11;
  
  // Operand 1 (bits xx345xxx)
  var op1 = (o >> 3) & 0b111;
  
  // Operand 2 (bits xxxxx678)
  var op2 = o & 0b111;
  
  // Mod 0b11
  if(mod == 0b11){
  
    // s1
    // --
    
    // r8
    if(s1 == 0){
      ret += ["0", "1", "2", "3", "4", "ch", "dh", "7"][op2];
    }
    
    // r16
    if(s1 == 1){
      ret += ["ax", "cx", "dx", "bx", "sp", "bp", "si", "di"][op1];
    }
    
    // Sreg
    if(s1 == 5){
      ret += ["es", "cs", "ss", "ds", "fs", "gs", "res.", "res."][op1];
    }
    
    // s2
    // --
    
    // r8
    if(s2 === 0){
      // "=== 0" to avoid matching undefined
    }
    
    // r16
    if(s2 == 1){
      ret += "," + ["ax", "cx", "dx", "bx", "sp", "bp", "si", "di"][op2];
    }
  }
  
  // RM (reverse operands 1 and 2)
  if(oe == 1){
    ret = ret.split(",").reverse().join(",");
  }
  
  // Debug
  //ret += "<td>mod = " + mod.toString(2) + ", op1 = " + op1.toString(2) + ", op2 = " + op2.toString(2);
  */
  
  return ret;
}