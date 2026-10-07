# снимок по строке из кнопки «Скопировать вид»: python snapq.py out.png "?view=...&dims=...&flags=...&sel=..."
import os,subprocess,sys
EDGE="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
H=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","index.html")
out=os.path.abspath(sys.argv[1]);q=sys.argv[2].strip()
if not q.startswith('?'):q='?'+q.split('?',1)[-1]
if os.path.exists(out):os.remove(out)
import urllib.parse as up
asp=float((up.parse_qs(q[1:]).get('asp') or ['1.556'])[0]);Hh=900;Ww=int(Hh*asp)   # кадр той же формы, что окно у пользователя
url='file:///'+H.replace(os.sep,'/')+q
subprocess.run([EDGE,'--headless=new','--user-data-dir='+os.path.join(os.environ.get('TEMP','.'),'edgeprof','s'+str(os.getpid())),'--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--virtual-time-budget=9000',f'--window-size={Ww},{Hh}','--screenshot='+out,url],capture_output=True,timeout=120)
print(os.path.exists(out))
