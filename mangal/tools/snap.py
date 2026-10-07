# снимок модели: python snap.py out.png "cx,cy,cz,tx,ty,tz" [dims] [flags-json] [sel]
import os,subprocess,urllib.parse,sys,json
EDGE="C:/Program Files/Google/Chrome/Application/chrome.exe"
H=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","index.html")
out=os.path.abspath(sys.argv[1]);q=dict(view=sys.argv[2],dims=sys.argv[3] if len(sys.argv)>3 else '')
q['flags']=sys.argv[4] if len(sys.argv)>4 and sys.argv[4] else json.dumps(dict(rain=True,kazan=False,grates2=False))
if len(sys.argv)>5:q['sel']=sys.argv[5]
if os.path.exists(out):os.remove(out)
url='file:///'+H.replace(os.sep,'/')+'?'+urllib.parse.urlencode(q)
subprocess.run([EDGE,'--headless=new','--user-data-dir='+os.path.join(os.environ.get('TEMP','.'),'edgeprof','s'+str(os.getpid())),'--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--virtual-time-budget=9000','--window-size=1400,900','--screenshot='+out,url],capture_output=True,timeout=170)
print(os.path.exists(out))
