#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <ApplicationServices/ApplicationServices.h>
static id attr(AXUIElementRef e, CFStringRef name, AXError *error) { CFTypeRef v=NULL; *error=AXUIElementCopyAttributeValue(e,name,&v); return v ? CFBridgingRelease(v) : nil; }
static NSMutableDictionary *readTree(AXUIElementRef e,int depth,NSMutableArray *path,int *count) {
 AXError er; pid_t pid=0; AXUIElementGetPid(e,&pid); NSMutableDictionary *n=[NSMutableDictionary dictionaryWithDictionary:@{@"pid":@(pid),@"depth":@(depth)}];
 for(NSString *a in @[@"AXRole",@"AXSubrole",@"AXTitle",@"AXDescription",@"AXEnabled",@"AXIdentifier"]){id v=attr(e,(__bridge CFStringRef)a,&er); if(v && ([v isKindOfClass:NSString.class] || [v isKindOfClass:NSNumber.class]))n[a]=v;}
 NSArray *p=[path arrayByAddingObject:n[@"AXTitle"] ?: n[@"AXRole"] ?: @"?"]; n[@"path"]=p; (*count)++;
 id c=attr(e,kAXChildrenAttribute,&er); n[@"childrenError"]=@(er); NSMutableArray *cs=[NSMutableArray array];
 if(depth<30 && *count<3000 && [c isKindOfClass:NSArray.class]) for(id child in c) if(CFGetTypeID((__bridge CFTypeRef)child)==AXUIElementGetTypeID())[cs addObject:readTree((__bridge AXUIElementRef)child,depth+1,[p mutableCopy],count)];
 n[@"children"]=cs; return n;
}
int main(int argc,const char **argv){@autoreleasepool {if(argc!=2)return 2;pid_t pid=atoi(argv[1]);if(pid<1)return 2;AXUIElementRef app=AXUIElementCreateApplication(pid);AXUIElementSetMessagingTimeout(app,5);AXError er;id menu=attr(app,kAXMenuBarAttribute,&er);int count=0;NSMutableDictionary *r=[@{@"pid":@(pid),@"trusted":@(AXIsProcessTrusted()),@"menuBarError":@(er),@"readonly":@YES} mutableCopy];if(menu && CFGetTypeID((__bridge CFTypeRef)menu)==AXUIElementGetTypeID())r[@"menuBar"]=readTree((__bridge AXUIElementRef)menu,0,[NSMutableArray array],&count);r[@"nodeCount"]=@(count);NSData*d=[NSJSONSerialization dataWithJSONObject:r options:NSJSONWritingPrettyPrinted error:NULL];fwrite(d.bytes,1,d.length,stdout);fwrite("\n",1,1,stdout);CFRelease(app);return er==kAXErrorSuccess && count>10 ? 0:1;}}
