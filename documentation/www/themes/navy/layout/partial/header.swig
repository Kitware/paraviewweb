<header id="header" class="wrapper">
  <div id="header-inner" class="inner">
    <h1 id="logo-wrap">
      <a href="{{ url_for_lang('') }}" id="logo">ParaViewWeb</a>
    </h1>
    <nav id="main-nav">
      {{ header_menu('main-nav') }}
      <a href="https://github.com/{{ config.github }}" class="main-nav-link"><i class="fa fa-github-alt"></i></a>
      <div id="search-input-wrap">
        <div id="search-input-icon">
          <i class="fa fa-search"></i>
        </div>
        <input type="search" id="search-input" placeholder="Search...">
      </div>
    </nav>
    <a id="mobile-nav-toggle">
      <span class="mobile-nav-toggle-bar"></span>
      <span class="mobile-nav-toggle-bar"></span>
      <span class="mobile-nav-toggle-bar"></span>
    </a>
  </div>
</header>
