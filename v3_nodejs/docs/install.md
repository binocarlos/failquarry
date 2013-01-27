## GMP

  cd ~/.sources
  wget ftp://ftp.gmplib.org/pub/gmp-5.0.5/gmp-5.0.5.tar.bz2
  tar -xvjpf gmp-5.0.5.tar.bz2
  cd gmp-5.0.5
	./configure --enable-cxx
  make
  make install
  ldconfig

## OR

 aptitude install libgmp3-dev
 npm install bigint