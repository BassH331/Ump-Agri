   import { TouchableOpacity, Image } from 'react-native';
   import { useNavigation } from '@react-navigation/native';

   export default function CustomMenuIcon(){
     const navigation = useNavigation();

     return (
       <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
         <Image
           source={require('../assets/burger-menu.png')} // Replace with your icon path
           resizeMode="contain"
           style={{ width: 27, height: 50 ,left: 22}}
         />
       </TouchableOpacity>
     );
   }