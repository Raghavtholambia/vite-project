public class ApexBasicAssignment {
    public static Boolean isPalindrome(String str){
        Integer s=0, e=str.length()-1;
       // system.debug(str.charAt(s)) ;
        List<String> newStr=  str.split('');
        while(s<=e){
            system.debug(str.charAt(s));
            if(newStr[s]!=newStr[e])
            { 
                return false;
            }
            e--;
            s++;
        } 

        return true;  
    }
    
    
    public static Integer sumOfDigits(Integer num){
        Integer sum=0,rem;
		while(num>0){
            sum+=Math.Mod(num, 10);
            num/=10;
        }
        return sum;
    }
   
    public static List<Integer> reverseList(List<Integer> inputList){
         //    (new List<Integer>{1,2,3});
        Integer s=0,e=inputList.size()-1;
        while(s<=e){
            integer temp=inputList[s];
            inputList[s]=inputList[e];
            inputList[e]=temp;
            s++;
            e--;
        }
        return inputList;
    }
    
    public static Map<Integer, List<Integer>> map2DList(List<List<Integer>> inputList){        /*
         ApexBasicAssignment.TwoDListIntoMap(new List<List<Integer>>{
    new List<Integer>{11, 22},
    new List<Integer>{111, 222, 222, 200}
    }
);
*/
        map<Integer, List<Integer>>mapp=new map<Integer,List<Integer>>();
        for(integer i=0; i<inputList.size(); i++){
        mapp.put(i,inputList[i]);
        }
        return mapp;
        
    }
    
    
    public static List<List<String>> removeDuplicatesAndSort(List<List<String>> inputList){
    List<List<String>>L1= new List<List<String>>{new List<String>{'a;b;a;v;c','x;x;y;c;q'},new List<String>{'m;b;h;j;m','u;k;j;u'}}; 
            List<List<String>>Ans=New List<List<String>>();
        for(List<String> allLists : L1){
            List<String>GenratedList=New List<String>();        

            for(String Str : allLists){
                List<String> newList=str.split(';');
                Set<String>S1=new Set<String>(newList);
                List<String>NewL1=new List<String>();
                NewL1.addAll(S1);
                NewL1.sort();
                string ResStr=String.join(NewL1,';');
                
                GenratedList.add(ResStr); 

            }
            Ans.add(GenratedList);

        }
        System.debug(Ans);
        return Ans;

 
            
    }
    
    public static List<Integer> rotateClockwise(List<Integer> inputList, Integer positions){
        List<Integer>l1=new List<Integer>{1,2,3,4};
        List<Integer>l2=l1.clone();
		Integer k=2;
        integer n=l1.size();
        
        for(integer i=n-1; i>0; i--){
            Integer newIndex = Math.mod(i + k, n);
            	l2.set(newIndex,l1.get(i));
        }
        system.debug(l1);
		system.debug(l2);
        return l2;

    }
    
    
public static List<Integer> rotateAntiClockwise(List<Integer> inputList, Integer positions) {

    Integer n = inputList.size();

    positions = Math.mod(positions, n);

    List<Integer> result = inputList.clone();

    for(Integer i = 0; i < n; i++) {

        Integer newIndex = Math.mod(i - positions + n, n);

        result.set(newIndex, inputList.get(i));
    }

    return result;
}
    
    
public static List<Integer> findLeaders(List<Integer> inputList){
    
    List<integer>Ans=new List<Integer>();
    Integer s=0, e=inputList.size();
    while(s++<=e){
        for(Integer i=s; i<e; i++){

            if(inputList[s]<inputList[i]){
                break;
            }
            if(i==e-1){
                Ans.add(inputList[s]);
            }
        }
        
    }
    system.debug(Ans);
    return Ans;
}    
    
    
}